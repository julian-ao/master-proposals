/**
 * Script to generate improved titles for projects using AI
 *
 * This script reads project data from the most recent JSON file,
 * sends each project description to an AI model,
 * and saves the generated titles to a new JSON file.
 *
 * Run with: npx tsx scripts/generate-titles.ts
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from .env file
dotenv.config();

// Add progress bar functionality
function createProgressBar(
  total: number,
  barLength: number = 30,
): {
  update: (current: number) => void;
  complete: () => void;
} {
  let startTime = Date.now();

  function formatTime(ms: number): string {
    // For times less than a minute
    if (ms < 60000) {
      return `${Math.floor(ms / 1000)}s`;
    }
    // For times less than an hour
    if (ms < 3600000) {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
    // For longer times
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  function calculateETA(current: number): string {
    if (current === 0) return "calculating...";

    const elapsedMs = Date.now() - startTime;
    const msPerItem = elapsedMs / current;
    const itemsRemaining = total - current;
    const msRemaining = msPerItem * itemsRemaining;

    return formatTime(msRemaining);
  }

  function render(current: number) {
    const percentage = Math.floor((current / total) * 100);
    const filledLength = Math.floor((current / total) * barLength);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

    const eta = calculateETA(current);
    const elapsed = formatTime(Date.now() - startTime);

    process.stdout.write(
      `\r[${bar}] ${percentage}% | ${current}/${total} | Elapsed: ${elapsed} | ETA: ${eta}`,
    );

    if (current === total) {
      const totalTime = formatTime(Date.now() - startTime);
      process.stdout.write(`\nCompleted in ${totalTime}\n`);
    }
  }

  return {
    update: (current: number) => {
      render(current);
    },
    complete: () => {
      render(total);
    },
  };
}

interface IProject {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  teacher: string;
  status: string;
  link: string;
  programs: string[];
  type: "single" | "duo";
}

// Function to get the most recent projects JSON file
function getMostRecentProjectsFile(): string {
  const dataDir = path.join(__dirname, "..", "data");

  if (!fs.existsSync(dataDir)) {
    throw new Error(
      "Data directory not found. Please run scrape-projects.ts first.",
    );
  }

  const projectFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.startsWith("projects-") && file.endsWith(".json"))
    .map((file) => path.join(dataDir, file));

  if (projectFiles.length === 0) {
    throw new Error(
      "No project data files found. Please run scrape-projects.ts first.",
    );
  }

  // Sort files by modification time (newest first)
  projectFiles.sort((a, b) => {
    return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
  });

  return projectFiles[0];
}

async function generateTitles() {
  console.log("Starting improved title generation...");

  try {
    // Get the most recent projects file
    const projectsFile = getMostRecentProjectsFile();
    console.log(`Using project data from: ${projectsFile}`);

    // Read project data
    const projectData = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
    const projects: IProject[] = projectData.projects;

    console.log(`Found ${projects.length} projects to generate titles for`);

    // Determine which model to use
    const modelProvider = process.env.MODEL_PROVIDER || "lmstudio";
    console.log(`Using model provider: ${modelProvider}`);

    let model;

    // Initialize the selected model
    if (modelProvider === "gemini") {
      // Check if API key is available
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error(
          "GOOGLE_API_KEY environment variable is required for Gemini model",
        );
      }

      console.log("Initializing Google Gemini model...");
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
      });

      // Use Gemini 2.0 flash
      model = google("models/gemini-2.0-flash");
    } else {
      // Default to LMStudio
      console.log("Initializing LMStudio model...");
      const lmstudio = createOpenAICompatible({
        name: "lmstudio",
        baseURL: "http://localhost:1234/v1",
      });

      // Use local model
      const modelName = process.env.LMSTUDIO_MODEL || "gemma-3-27b-it";
      model = lmstudio(modelName);
    }

    // Store titles - using project ID as key
    const titles: Record<
      string,
      { originalTitle: string; improvedTitle: string }
    > = {};

    // Define batch size
    const batchSize = process.env.BATCH_SIZE
      ? parseInt(process.env.BATCH_SIZE)
      : 5;
    console.log(`Processing in batches of ${batchSize} projects`);

    // Create progress bar
    const progressBar = createProgressBar(projects.length);
    let completedCount = 0;

    // Split projects into batches
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(projects.length / batchSize)}`,
      );

      // Process batch in parallel
      const batchPromises = batch.map(async (project) => {
        try {
          // Use both short and full descriptions for better context
          const shortDesc = project.shortDescription || "";
          const fullDesc = project.fullDescription || "";
          const originalTitle = project.title || "";

          // Clean both descriptions by removing HTML tags
          const cleanShortDesc = shortDesc.replace(/<[^>]*>?/gm, "");
          const cleanFullDesc = fullDesc.replace(/<[^>]*>?/gm, "");

          // Combine both descriptions for better context
          const combinedDescription =
            cleanShortDesc +
            (cleanShortDesc && cleanFullDesc ? "\n\n" : "") +
            cleanFullDesc;

          // Generate system prompt
          const systemPrompt =
            "You are an academic assistant that specializes in creating clear, concise, and engaging titles for academic research projects. " +
            "Create a better, more specific title that clearly communicates the focus of the project. " +
            "The title should be shorter than the original when possible, more specific, and more engaging. " +
            "Avoid generic academic phrases like 'A Study of' or 'An Investigation Into'. " +
            "Only reply with the improved title, no additional text or explanation.";

          // Generate user prompt from project details
          const userPrompt =
            `Original title: ${originalTitle}\n\n` +
            `Project description: ${combinedDescription}\n\n` +
            `Create a better, more concise title that clearly communicates the focus of this project.`;

          // Call the AI model
          const result = await generateText({
            model: model,
            system: systemPrompt,
            prompt: userPrompt,
            maxTokens: 50,
          });

          // Return results with project ID
          return {
            id: project.id,
            originalTitle: project.title,
            improvedTitle: result.text.trim(),
          };
        } catch (error) {
          console.error(
            `Error generating title for project ID ${project.id}:`,
            error,
          );
          return {
            id: project.id,
            originalTitle: project.title,
            improvedTitle: "Failed to generate improved title.",
          };
        }
      });

      // Wait for all promises in the batch to resolve
      const batchResults = await Promise.all(batchPromises);

      // Store results in the titles object
      for (const result of batchResults) {
        titles[result.id] = {
          originalTitle: result.originalTitle,
          improvedTitle: result.improvedTitle,
        };
      }

      // Update progress
      completedCount += batch.length;
      progressBar.update(completedCount);
    }

    // Complete progress bar
    progressBar.complete();

    // Create output filename based on the input file
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const outputPath = path.join(
      path.dirname(projectsFile),
      `titles-${timestamp}.json`,
    );

    // Save titles to file
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
    console.log(
      `${Object.keys(titles).length}/${
        projects.length
      } improved titles generated`,
    );
    console.log(`Improved titles saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error generating titles:", error);
    process.exit(1);
  }
}

// Execute the script
generateTitles();
