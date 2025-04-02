/**
 * Standalone scraper to extract project data from NTNU website
 *
 * This script fetches project data from the NTNU website and saves it to a JSON file.
 * Run with: npx ts-node scripts/scrape-projects.ts
 */

import fs from "fs";
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import path from "path";
import { IProject, STUDY_PROGRAMS } from "../lib/constants";
import { parseProjectsFromHTML, processProjects } from "../lib/projectParser";

async function scrapeProjects() {
  console.log("Starting to scrape project data...");

  try {
    const programPromises = STUDY_PROGRAMS.map(async (program) => {
      console.log(`Fetching projects for ${program.name} (${program.id})...`);

      // Using the correct URL as seen in route.ts
      const url = new URL(
        "https://www.idi.ntnu.no/education/fordypningsprosjekt.php",
      );
      url.searchParams.append(program.id, "1");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${program.id}: ${response.statusText}`,
        );
      }

      return { programId: program.id, html: await response.text() };
    });

    const programResults = await Promise.all(programPromises);
    const projectsByProgram: IProject[][] = [];

    // Parse HTML for each program
    programResults.forEach(({ programId, html }) => {
      console.log(`Processing data for program ${programId}...`);
      const dom = new JSDOM(html);
      const projects = parseProjectsFromHTML(dom.window.document, programId);
      projectsByProgram.push(projects);
    });

    // Process projects to get merged projects and supervisors
    const { projects: allProjects, supervisors } =
      processProjects(projectsByProgram);

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(outputDir, `projects-${timestamp}.json`);

    // Save projects to JSON file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          projects: allProjects,
          supervisors,
          scrapedAt: new Date().toISOString(),
          totalProjects: allProjects.length,
          programCounts: STUDY_PROGRAMS.reduce(
            (acc, program) => {
              acc[program.id] = allProjects.filter((p) =>
                p.programs.includes(program.id),
              ).length;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
        null,
        2,
      ),
    );

    console.log(`Successfully scraped ${allProjects.length} projects!`);
    console.log(`Data saved to ${outputPath}`);
    console.log(`Supervisors found: ${supervisors.length}`);

    // Log project counts by program
    console.log("\nProject counts by program:");
    STUDY_PROGRAMS.forEach((program) => {
      const count = allProjects.filter((p) =>
        p.programs.includes(program.id),
      ).length;
      console.log(`- ${program.name} (${program.id}): ${count}`);
    });
  } catch (error) {
    console.error("Error scraping projects:", error);
    process.exit(1);
  }
}

// Execute the scraper
scrapeProjects();
