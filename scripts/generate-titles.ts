/**
 * Script to generate improved titles for projects using AI
 *
 * This script reads project data from the most recent JSON file,
 * sends each project description to an AI model
 * (OpenRouter by default),
 * and saves the generated titles to a new JSON file.
 *
 * Run with: npx tsx scripts/generate-titles.ts
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

async function generateTitles() {
  console.log("Starting improved title generation...");

  try {
    const projectsFile = getMostRecentProjectsFile();
    console.log(`Using project data from: ${projectsFile}`);

    const projectData = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
    const projects: Project[] = projectData.projects;
    console.log(`Found ${projects.length} projects to generate titles for`);

    const singleProjectId = getCliOption("project-id", "p") || process.env.PROJECT_ID;
    let projectsToProcess = projects;
    if (singleProjectId) {
      const selectedProject = projects.find((project) => project.id === singleProjectId);
      if (!selectedProject) {
        throw new Error(
          `Project with ID "${singleProjectId}" not found in ${path.basename(projectsFile)}`,
        );
      }

      projectsToProcess = [selectedProject];
      console.log(
        `Single-project test mode enabled for ID "${singleProjectId}" (${selectedProject.title})`,
      );
    }

    const { modelProvider, model, baseModel } = initializeLanguageModel({
      defaultProvider: "openrouter",
      useReasoningExtractionForNonOpenRouter: false,
    });

    const configuredRpm = getConfiguredRequestsPerMinute(modelProvider, 40);
    const waitForRateLimit =
      configuredRpm > 0 ? createRateLimiter(configuredRpm) : async () => Promise.resolve();

    if (configuredRpm > 0) {
      console.log(`Rate limiting enabled: ${configuredRpm} requests/minute`);
    }
    const debugTitles = process.env.DEBUG_TITLES === "1";

    const titles: Record<string, { originalTitle: string; improvedTitle: string }> = {};

    const batchSize = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 5;
    const effectiveBatchSize = singleProjectId ? 1 : batchSize;
    console.log(`Processing ${projectsToProcess.length} project(s) in batches of ${effectiveBatchSize}`);

    const progressBar = createProgressBar(projectsToProcess.length);
    let completedCount = 0;

    for (let i = 0; i < projectsToProcess.length; i += effectiveBatchSize) {
      const batch = projectsToProcess.slice(i, i + effectiveBatchSize);
      console.log(
        `Processing batch ${Math.floor(i / effectiveBatchSize) + 1}/${Math.ceil(projectsToProcess.length / effectiveBatchSize)}`,
      );

      const batchPromises = batch.map(async (project) => {
        try {
          const shortDesc = project.shortDescription || "";
          const fullDesc = project.fullDescription || "";
          const originalTitle = project.title || "";
          const cleanShortDesc = shortDesc.replace(/<[^>]*>?/gm, "");
          const cleanFullDesc = fullDesc.replace(/<[^>]*>?/gm, "");
          const combinedDescription =
            cleanShortDesc + (cleanShortDesc && cleanFullDesc ? "\n\n" : "") + cleanFullDesc;

          const systemPrompt =
            "You are an academic assistant that specializes in creating clear, concise, and engaging titles for academic research projects. " +
            "Create a better, more specific title that clearly communicates the focus of the project. " +
            "The title should be shorter than the original when possible, more specific, and more engaging. " +
            "Avoid generic academic phrases like 'A Study of' or 'An Investigation Into'. " +
            "Only reply with the improved title, no additional text or explanation.";

          const userPrompt =
            `Original title: ${originalTitle}\n\n` +
            `Project description: ${combinedDescription}\n\n` +
            `Create a better, more concise title that clearly communicates the focus of this project.`;

          await waitForRateLimit();
          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
          });

          let improvedTitle = result.text.trim();
          if (debugTitles || improvedTitle.length === 0) {
            console.log(
              `[title-debug] id=${project.id} textLen=${improvedTitle.length} reasoningLen=${result.reasoningText?.length ?? 0} finishReason=${result.finishReason}`,
            );
          }

          if (improvedTitle.length === 0) {
            await waitForRateLimit();
            const retryResult = await generateText({
              model: baseModel,
              system: systemPrompt,
              prompt: userPrompt,
            });

            improvedTitle = retryResult.text.trim();
            if (debugTitles || improvedTitle.length === 0) {
              console.log(
                `[title-debug] retry id=${project.id} textLen=${improvedTitle.length} reasoningLen=${retryResult.reasoningText?.length ?? 0} finishReason=${retryResult.finishReason}`,
              );
            }
          }

          return {
            id: project.id,
            originalTitle: project.title,
            improvedTitle: improvedTitle || project.title || "Failed to generate improved title.",
          };
        } catch (error) {
          console.error(`Error generating title for project ID ${project.id}:`, error);
          return {
            id: project.id,
            originalTitle: project.title,
            improvedTitle: "Failed to generate improved title.",
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        titles[result.id] = {
          originalTitle: result.originalTitle,
          improvedTitle: result.improvedTitle,
        };
      }

      completedCount += batch.length;
      progressBar.update(completedCount);
    }

    progressBar.complete();

    const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
    const outputPath = path.join(path.dirname(projectsFile), `titles-${timestamp}.json`);

    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          titles,
          originalDataFile: path.basename(projectsFile),
          generatedAt: new Date().toISOString(),
          totalTitles: Object.keys(titles).length,
        },
        null,
        2,
      ),
    );

    console.log(`\nTitle generation complete!`);
    console.log(`${Object.keys(titles).length}/${projectsToProcess.length} improved titles generated`);

    if (singleProjectId && titles[singleProjectId]) {
      console.log(`\nSingle-project title (${singleProjectId}):`);
      console.log(titles[singleProjectId].improvedTitle);
    }

    console.log(`Improved titles saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error generating titles:", error);
    process.exit(1);
  }
}

generateTitles();
