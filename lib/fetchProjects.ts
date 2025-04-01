import { IProject } from "./constants";

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
    const allProjects: IProject[] = [];
    const supervisors = new Set<string>();

    programResults.forEach(({ programId, html }) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const projectElements = doc.querySelectorAll(".oppgave");

      projectElements.forEach((element) => {
        const title =
          element.querySelector("h3")?.textContent?.trim() ||
          "Untitled Project";
        const description =
          element.querySelector("p")?.textContent?.trim() || "";
        const teacherElement = element.querySelector(".status a");
        const teacher = teacherElement?.textContent?.trim() || "Unknown";
        const teacherLink = teacherElement?.getAttribute("href") || "";
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

        const project = {
          id: link.split("oid=")[1] || crypto.randomUUID(),
          title,
          shortDescription: description,
          fullDescription: hiddenDesc || shownDesc,
          teacher,
          teacherLink, // Added teacher link
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

    return {
      projects: allProjects,
      availableSupervisors: Array.from(supervisors).sort(),
    };
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
