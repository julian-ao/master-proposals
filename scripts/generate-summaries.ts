/**
 * Script to generate summaries for projects using Vercel AI SDK
 *
 * This script reads project data from the most recent JSON file,
 * sends each project description to a local LMStudio model via the Vercel AI SDK,
 * and saves the summaries to a new JSON file.
 *
 * Run with: npx tsx scripts/generate-summaries.ts
 */

import fs from "fs";
import path from "path";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Add progress bar functionality
function createProgressBar(
    total: number,
    barLength: number = 30
): {
    update: (current: number) => void;
    complete: () => void;
} {
    let currentProgress = 0;
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
        const bar =
            "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

        const eta = calculateETA(current);
        const elapsed = formatTime(Date.now() - startTime);

        process.stdout.write(
            `\r[${bar}] ${percentage}% | ${current}/${total} | Elapsed: ${elapsed} | ETA: ${eta}`
        );

        if (current === total) {
            const totalTime = formatTime(Date.now() - startTime);
            process.stdout.write(`\nCompleted in ${totalTime}\n`);
        }
    }

    return {
        update: (current: number) => {
            currentProgress = current;
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
            "Data directory not found. Please run scrape-projects.ts first."
        );
    }

    const projectFiles = fs
        .readdirSync(dataDir)
        .filter(
            (file) => file.startsWith("projects-") && file.endsWith(".json")
        )
        .map((file) => path.join(dataDir, file));

    if (projectFiles.length === 0) {
        throw new Error(
            "No project data files found. Please run scrape-projects.ts first."
        );
    }

    // Sort files by modification time (newest first)
    projectFiles.sort((a, b) => {
        return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
    });

    return projectFiles[0];
}

async function generateSummaries() {
    console.log("Starting project summary generation...");

    try {
        // Get the most recent projects file
        const projectsFile = getMostRecentProjectsFile();
        console.log(`Using project data from: ${projectsFile}`);

        // Read project data
        const projectData = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
        const projects: IProject[] = projectData.projects;

        console.log(`Found ${projects.length} projects to summarize`);

        // Determine which model to use
        const modelProvider = process.env.MODEL_PROVIDER || "lmstudio";
        console.log(`Using model provider: ${modelProvider}`);

        let model;

        // Initialize the selected model
        if (modelProvider === "gemini") {
            // Check if API key is available
            if (!process.env.GOOGLE_API_KEY) {
                throw new Error(
                    "GOOGLE_API_KEY environment variable is required for Gemini model"
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

        // Store summaries
        const summaries: Record<string, string> = {};

        // Process projects in batches to avoid overwhelming the LM
        const batchSize = 5;

        // Create progress bar
        const progressBar = createProgressBar(projects.length);
        let completedCount = 0;

        for (let i = 0; i < projects.length; i += batchSize) {
            const batch = projects.slice(i, i + batchSize);

            console.log(
                `\nProcessing batch ${
                    Math.floor(i / batchSize) + 1
                }/${Math.ceil(projects.length / batchSize)}`
            );

            // Process each project in the batch
            const batchPromises = batch.map(async (project) => {
                try {
                    // Use both short and full descriptions for better context
                    const shortDesc = project.shortDescription || "";
                    const fullDesc = project.fullDescription || "";

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
                        "You are an academic assistant that specializes in creating concise, informative summaries of master's project proposals. " +
                        "Extract the key information such as research area, technologies, and expected outcomes. " +
                        "Keep summaries under 100 words. " +
                        "Focus on the key research aspects, technologies involved, and the expected outcomes. " +
                        "Only reply with the summary, no additional text.";

                    // Generate user prompt from project details
                    const userPrompt =
                        `Please summarize this master's project proposal:\n\n` +
                        `Title: ${project.title}\n` +
                        `Description: ${combinedDescription}`;

                    // Call the AI model
                    const result = await generateText({
                        model: model,
                        system: systemPrompt,
                        prompt: userPrompt,
                        maxTokens: 150,
                    });

                    // Store the summary
                    summaries[project.title] = result.text.trim();

                    // Update progress
                    completedCount++;
                    progressBar.update(completedCount);

                    // Add a small delay to avoid overwhelming the model
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(
                        `Error summarizing "${project.title}":`,
                        error
                    );
                    summaries[project.title] = "Failed to generate summary.";

                    // Update progress even for failed summaries
                    completedCount++;
                    progressBar.update(completedCount);
                }
            });

            // Wait for all projects in this batch to be processed
            await Promise.all(batchPromises);
        }

        // Complete progress bar
        progressBar.complete();

        // Create output filename based on the input file
        const inputFilename = path.basename(projectsFile);
        const summaryFilename = inputFilename.replace(
            "projects-",
            "summaries-"
        );
        const outputPath = path.join(
            path.dirname(projectsFile),
            summaryFilename
        );

        // Save summaries to file
        fs.writeFileSync(
            outputPath,
            JSON.stringify(
                {
                    summaries,
                    originalDataFile: inputFilename,
                    generatedAt: new Date().toISOString(),
                    totalSummaries: Object.keys(summaries).length,
                },
                null,
                2
            )
        );

        console.log(`\nSummary generation complete!`);
        console.log(
            `${Object.keys(summaries).length}/${
                projects.length
            } projects summarized`
        );
        console.log(`Summaries saved to: ${outputPath}`);
    } catch (error) {
        console.error("Error generating summaries:", error);
        process.exit(1);
    }
}

// Execute the script
generateSummaries();
