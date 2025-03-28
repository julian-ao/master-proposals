"use client";

import { useAtom, useSetAtom } from "jotai";
import { ReactNode, useEffect } from "react";
import {
    projectsAtom,
    availableSupervisorsAtom,
    loadingProjectsAtom,
    errorAtom,
    selectedProgramsAtom,
    projectsFetchedAtom,
} from "../lib/atoms";
import { fetchProjects } from "../lib/fetchProjects";

export function ProjectDataProvider({ children }: { children: ReactNode }) {
    const [selectedPrograms] = useAtom(selectedProgramsAtom);
    const [projectsFetched, setProjectsFetched] = useAtom(projectsFetchedAtom);
    const setProjects = useSetAtom(projectsAtom);
    const setAvailableSupervisors = useSetAtom(availableSupervisorsAtom);
    const setLoading = useSetAtom(loadingProjectsAtom);
    const setError = useSetAtom(errorAtom);

    // Fetch projects initially and when selected programs change
    useEffect(() => {
        async function loadProjects() {
            if (
                !projectsFetched ||
                Object.values(selectedPrograms).some((selected) => selected)
            ) {
                setLoading(true);
                setError(null);

                try {
                    const { projects, availableSupervisors } =
                        await fetchProjects(selectedPrograms);
                    setProjects(projects);
                    setAvailableSupervisors(availableSupervisors);
                    setProjectsFetched(true);
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to fetch projects"
                    );
                    console.error("Fetch error:", err);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadProjects();
    }, [
        selectedPrograms,
        projectsFetched,
        setProjects,
        setAvailableSupervisors,
        setLoading,
        setError,
        setProjectsFetched,
    ]);

    return <>{children}</>;
}
