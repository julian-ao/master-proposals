/**
 * Project Parser Utility
 *
 * Shared logic for parsing project data from both the browser and server-side
 * Used by fetchProjects.ts and scrape-projects.ts
 */

import { IProject } from "./constants";

export interface ParsedProjectsResult {
  projects: IProject[];
  supervisors: string[];
}

/**
 * Parses HTML content to extract project data
 * Works with both JSDOM (Node.js) and browser DOM
 *
 * @param document The document object (from JSDOM or browser)
 * @param programId The program ID associated with this HTML
 * @returns Parsed projects and extracted supervisors
 */
export function parseProjectsFromHTML(
  document: Document,
  programId: string,
): IProject[] {
  const projects: IProject[] = [];
  const projectElements = document.querySelectorAll(".oppgave");

  projectElements.forEach((element) => {
    const title =
      element.querySelector("h3")?.textContent?.trim() || "Untitled Project";
    const description = element.querySelector("p")?.textContent?.trim() || "";
    const teacherElement = element.querySelector(".status a");
    const teacher = teacherElement?.textContent?.trim() || "Unknown";
    const teacherLink = teacherElement?.getAttribute("href") || "";
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
      } else if (studentImg.getAttribute("src")?.includes("student_singel")) {
        type = "single";
      }
    }

    divs.forEach((div) => {
      if (div.id.startsWith("shown_")) shownDesc = div.innerHTML;
      else if (div.id.startsWith("hidden_")) hiddenDesc = div.innerHTML;
    });

    // Generate a consistent ID
    const projectId =
      link.split("oid=")[1] ||
      (typeof Buffer !== "undefined"
        ? Buffer.from(`${title}-${teacher}`).toString("base64").substring(0, 12)
        : crypto.randomUUID());

    const project: IProject = {
      id: projectId,
      title,
      shortDescription: description,
      fullDescription: hiddenDesc || shownDesc,
      teacher,
      teacherLink,
      status,
      link,
      programs: [programId],
      type,
    };

    projects.push(project);
  });

  return projects;
}

/**
 * Merges projects from multiple programs, combining program lists for duplicate projects
 *
 * @param projectsList Array of projects arrays from different programs
 * @returns Single merged array of unique projects with combined program lists
 */
export function mergeProjectsFromPrograms(
  projectsList: IProject[][],
): IProject[] {
  const mergedProjects: IProject[] = [];

  projectsList.flat().forEach((project) => {
    const existingIndex = mergedProjects.findIndex(
      (p) => p.title === project.title && p.teacher === project.teacher,
    );

    if (existingIndex >= 0) {
      // Combine programs for existing project
      mergedProjects[existingIndex].programs = [
        ...new Set([
          ...mergedProjects[existingIndex].programs,
          ...project.programs,
        ]),
      ];
    } else {
      // Add new project
      mergedProjects.push(project);
    }
  });

  return mergedProjects;
}

/**
 * Extracts unique supervisor names from a list of projects
 *
 * @param projects List of projects
 * @returns Sorted array of unique supervisor names
 */
export function extractSupervisors(projects: IProject[]): string[] {
  const supervisors = new Set<string>();

  projects.forEach((project) => {
    if (project.teacher && project.teacher !== "Unknown") {
      supervisors.add(project.teacher);
    }
  });

  return Array.from(supervisors).sort();
}

/**
 * Processes projects from multiple programs and returns consolidated results
 *
 * @param projectsByProgram Array of projects arrays from different programs
 * @returns Object containing merged projects and unique supervisors
 */
export function processProjects(
  projectsByProgram: IProject[][],
): ParsedProjectsResult {
  const projects = mergeProjectsFromPrograms(projectsByProgram);
  const supervisors = extractSupervisors(projects);

  return {
    projects,
    supervisors,
  };
}
