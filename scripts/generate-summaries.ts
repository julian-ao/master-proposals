/**
 * Script to generate summaries for projects using Vercel AI SDK
 *
 * This script reads project data from the most recent JSON file,
 * sends each project description to an AI model via the Vercel AI SDK
 * (OpenRouter by default),
 * and saves the summaries to a new JSON file.
 *
 * Run with: npx tsx scripts/generate-summaries.ts
 * Test a single project: npx tsx scripts/generate-summaries.ts --project-id <id>
 */

import { generateText } from "ai";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import {
  type Project,
  createProgressBar,
  createRateLimiter,
  getCliOption,
  getConfiguredRequestsPerMinute,
  getMostRecentProjectsFile,
  initializeLanguageModel,
} from "./ai-script-utils";

// Load environment variables from .env file
dotenv.config();

async function generateSummaries() {
  console.log("Starting project summary generation...");

  try {
    const projectsFile = getMostRecentProjectsFile();
    console.log(`Using project data from: ${projectsFile}`);

    const projectData = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
    const projects: Project[] = projectData.projects;
    console.log(`Found ${projects.length} projects to summarize`);

    const singleProjectId = getCliOption("project-id", "p") || process.env.PROJECT_ID;
    let projectsToSummarize = projects;

    if (singleProjectId) {
      const selectedProject = projects.find((project) => project.id === singleProjectId);
      if (!selectedProject) {
        throw new Error(
          `Project with ID "${singleProjectId}" not found in ${path.basename(projectsFile)}`,
        );
      }

      projectsToSummarize = [selectedProject];
      console.log(
        `Single-project test mode enabled for ID "${singleProjectId}" (${selectedProject.title})`,
      );
    }

    const { modelProvider, model, baseModel } = initializeLanguageModel({
      defaultProvider: "openrouter",
      useReasoningExtractionForNonOpenRouter: true,
    });

    const debugSummary = process.env.DEBUG_SUMMARY === "1";
    const configuredRpm = getConfiguredRequestsPerMinute(modelProvider, 45);
    const waitForRateLimit =
      configuredRpm > 0 ? createRateLimiter(configuredRpm) : async () => Promise.resolve();

    if (configuredRpm > 0) {
      console.log(`Rate limiting enabled: ${configuredRpm} requests/minute`);
    }

    const summaries: Record<string, { title: string; summary: string }> = {};

    const configuredBatchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 20;
    const batchSize = singleProjectId ? 1 : configuredBatchSize;
    console.log(`Processing ${projectsToSummarize.length} project(s) in batches of ${batchSize}`);

    const progressBar = createProgressBar(projectsToSummarize.length);
    let completedCount = 0;

    for (let i = 0; i < projectsToSummarize.length; i += batchSize) {
      const batch = projectsToSummarize.slice(i, i + batchSize);
      console.log(
        `\nProcessing batch ${
          Math.floor(i / batchSize) + 1
        }/${Math.ceil(projectsToSummarize.length / batchSize)}`,
      );

      const batchPromises = batch.map(async (project) => {
        try {
          const shortDesc = project.shortDescription || "";
          const fullDesc = project.fullDescription || "";
          const cleanShortDesc = shortDesc.replace(/<[^>]*>?/gm, "");
          const cleanFullDesc = fullDesc.replace(/<[^>]*>?/gm, "");
          const combinedDescription =
            cleanShortDesc + (cleanShortDesc && cleanFullDesc ? "\n\n" : "") + cleanFullDesc;

          const systemPrompt =
            "You are an academic assistant that specializes in creating concise, informative summaries of master's project proposals. " +
            "Extract the key information such as research area, technologies, and expected outcomes. " +
            "The goal is to help students decide if a project aligns with their interests. " +
            "Keep summaries under 100 words. " +
            "Focus on the key research aspects, technologies involved, and the expected outcomes. " +
            "Only reply with the summary, no additional text. " +
            "Do not include reasoning, think tags, XML tags, or markdown fences.";

          const userPrompt =
            `Please summarize this master's project proposal:\n\n` +
            `Title: ${project.title}\n` +
            `Description: ${combinedDescription}`;

          await waitForRateLimit();
          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
          });

          let summaryText = result.text.trim();
          if (debugSummary || summaryText.length === 0) {
            console.log(
              `[summary-debug] id=${project.id} textLen=${summaryText.length} reasoningLen=${result.reasoningText?.length ?? 0} finishReason=${result.finishReason}`,
            );
          }

          if (summaryText.length === 0) {
            await waitForRateLimit();
            const retryResult = await generateText({
              model: baseModel,
              system: systemPrompt,
              prompt: userPrompt,
            });

            summaryText = retryResult.text.trim();
            if (debugSummary || summaryText.length === 0) {
              console.log(
                `[summary-debug] retry id=${project.id} textLen=${summaryText.length} reasoningLen=${retryResult.reasoningText?.length ?? 0} finishReason=${retryResult.finishReason}`,
              );
            }
          }

          return {
            id: project.id,
            title: project.title,
            summary: summaryText || "Failed to generate summary.",
          };
        } catch (error) {
          console.error(`Error summarizing project ID ${project.id}:`, error);
          return {
            id: project.id,
            title: project.title,
            summary: "Failed to generate summary.",
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        summaries[result.id] = {
          title: result.title,
          summary: result.summary,
        };
      }

      completedCount += batch.length;
      progressBar.update(completedCount);
    }

    progressBar.complete();

    const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
    const safeProjectId = singleProjectId?.replace(/[^a-zA-Z0-9_-]/g, "_");
    const outputFilename = safeProjectId
      ? `summary-${safeProjectId}-${timestamp}.json`
      : `summaries-${timestamp}.json`;
    const outputPath = path.join(path.dirname(projectsFile), outputFilename);

    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          summaries,
          originalDataFile: path.basename(projectsFile),
          generatedAt: new Date().toISOString(),
          singleProjectId: singleProjectId || null,
          totalSummaries: Object.keys(summaries).length,
        },
        null,
        2,
      ),
    );

    console.log(`\nSummary generation complete!`);
    console.log(
      `${Object.keys(summaries).length}/${projectsToSummarize.length} projects summarized`,
    );

    if (singleProjectId && summaries[singleProjectId]) {
      console.log(`\nSingle-project summary (${singleProjectId}):`);
      console.log(summaries[singleProjectId].summary);
    }

    console.log(`Summaries saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error generating summaries:", error);
    process.exit(1);
  }
}

generateSummaries();
