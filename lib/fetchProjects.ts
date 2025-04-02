import { IProject } from "./constants";
import { parseProjectsFromHTML, processProjects } from "./projectParser";

/**
 * Fetches projects from the IDI API for the given study programs
 * @param selectedPrograms Record of program IDs and whether they're selected
 * @returns Object containing projects and available supervisors
 */
export async function fetchProjects(
  selectedPrograms: Record<string, boolean>,
): Promise<{
  projects: IProject[];
  availableSupervisors: string[];
}> {
  try {
    const programPromises = Object.entries(selectedPrograms)
      .filter(([_, isSelected]) => isSelected)
      .map(async ([programId]) => {
        const response = await fetch(`/api/idi?${programId}=1`);
        if (!response.ok) throw new Error(`Failed to fetch ${programId}`);
        return { programId, html: await response.text() };
      });

    const programResults = await Promise.all(programPromises);
    const projectsByProgram: IProject[][] = [];

    programResults.forEach(({ programId, html }) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const projects = parseProjectsFromHTML(doc, programId);
      projectsByProgram.push(projects);
    });

    const result = processProjects(projectsByProgram);

    return {
      projects: result.projects,
      availableSupervisors: result.supervisors,
    };
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
