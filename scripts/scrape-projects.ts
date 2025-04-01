/**
 * Standalone scraper to extract project data from NTNU website
 *
 * This script fetches project data from the NTNU website and saves it to a JSON file.
 * Run with: npx ts-node scripts/scrape-projects.ts
 */

import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import fetch from "node-fetch";

// Import project interfaces
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

// Study programs to scrape
const STUDY_PROGRAMS = [
  { id: "p2_6", name: "Programvaresystemer" },
  { id: "p2_7", name: "Databaser og søk" },
  { id: "p2_9", name: "Kunstig intelligens" },
  { id: "p2_10", name: "Interaksjonsdesign, spill- og læringsteknologi" },
];

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
    const allProjects: IProject[] = [];
    const supervisors = new Set<string>();

    programResults.forEach(({ programId, html }) => {
      console.log(`Processing data for program ${programId}...`);
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const projectElements = doc.querySelectorAll(".oppgave");

      projectElements.forEach((element) => {
        const title =
          element.querySelector("h3")?.textContent?.trim() ||
          "Untitled Project";
        const description =
          element.querySelector("p")?.textContent?.trim() || "";
        const teacher =
          element.querySelector(".status a")?.textContent?.trim() || "Unknown";
        supervisors.add(teacher);
        const status =
          element.querySelector(".status i")?.textContent?.trim() || "Unknown";
        const link =
          element
            .querySelector('.status a[href^="oppgaveforslag"]')
            ?.getAttribute("href") || "#";

        let shownDesc = "";
        let hiddenDesc = "";
        const divs = element.querySelectorAll(
          'div[id^="shown_"], div[id^="hidden_"]',
        );

        const statusDiv = element.querySelector(".status");
        const studentImg = statusDiv?.querySelector('img[src*="student_"]');

        let type: "single" | "duo" = "single"; // default to single
        if (studentImg) {
          if (studentImg.getAttribute("src")?.includes("student_group")) {
            type = "duo";
          } else if (
            studentImg.getAttribute("src")?.includes("student_singel")
          ) {
            type = "single";
          }
        }

        divs.forEach((div) => {
          if (div.id.startsWith("shown_")) shownDesc = div.innerHTML;
          else if (div.id.startsWith("hidden_")) hiddenDesc = div.innerHTML;
        });

        // Generate an ID consistently
        const projectId =
          link.split("oid=")[1] ||
          Buffer.from(`${title}-${teacher}`)
            .toString("base64")
            .substring(0, 12);

        const project = {
          id: projectId,
          title,
          shortDescription: description,
          fullDescription: hiddenDesc || shownDesc,
          teacher,
          status,
          link,
          programs: [programId],
          type,
        };

        const existingIndex = allProjects.findIndex(
          (p) => p.title === title && p.teacher === teacher,
        );
        if (existingIndex >= 0) {
          allProjects[existingIndex].programs = [
            ...new Set([
              ...allProjects[existingIndex].programs,
              ...project.programs,
            ]),
          ];
        } else {
          allProjects.push(project);
        }
      });
    });

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
          supervisors: Array.from(supervisors).sort(),
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
    console.log(`Supervisors found: ${Array.from(supervisors).length}`);

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
