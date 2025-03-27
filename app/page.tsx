"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectCard } from "../components/ProjectCard";
import { StudyProgramFilter } from "../components/StudyProgramFilter";
import { SortAndFilterControls } from "../components/SortAndFilterControls";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorMessage } from "../components/ErrorMessage";
import { IProject, STUDY_PROGRAMS } from "../lib/constants";
import { SupervisorFilter } from "../components/SupervisorFilter";
import { ProjectTypeFilter } from "../components/ProjectTypeFilter";
import { useLocalStorage } from "usehooks-ts";
import { useToast } from "../hooks/use-toast";
import { useAtom, useAtomValue } from "jotai";
import {
    projectsAtom,
    availableSupervisorsAtom,
    loadingProjectsAtom,
    errorAtom,
    selectedProgramsAtom,
} from "../lib/atoms";

// Interface for summaries
interface ISummaries {
    summaries: Record<string, string>;
    originalDataFile: string;
    generatedAt: string;
    totalSummaries: number;
}

export default function ProjectBrowser() {
    const [selectedPrograms, setSelectedPrograms] =
        useAtom(selectedProgramsAtom);
    const projects = useAtomValue(projectsAtom);
    const loading = useAtomValue(loadingProjectsAtom);
    const error = useAtomValue(errorAtom);
    const availableSupervisors = useAtomValue(availableSupervisorsAtom);

    const [filterMode, setFilterMode] = useState<"union" | "intersection">(
        "union"
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [projectTypeFilter, setProjectTypeFilter] = useState<
        "all" | "single" | "duo"
    >("all");

    // Add state for AI summaries
    const [summaries, setSummaries] = useState<Record<string, string>>({});
    const [showAiSummaries, setShowAiSummaries] = useState(false);

    const [selectedSupervisors, setSelectedSupervisors] = useState<
        Record<string, boolean>
    >({});
    const [excludedSupervisors, setExcludedSupervisors] = useState<
        Record<string, boolean>
    >({});

    const [showFavorites, setShowFavorites] = useState(false);
    const [hideFavorites, setHideFavorites] = useState(false);

    const [favorites, setFavorites] = useLocalStorage<string[]>(
        "favorites",
        []
    );

    // Add state for hidden projects
    const [hiddenProjects, setHiddenProjects] = useLocalStorage<string[]>(
        "hiddenProjects",
        []
    );
    const [showHiddenProjects, setShowHiddenProjects] = useState(false);

    const [showAvailableOnly, setShowTildelt] = useState(true);

    // Add state for auto-expand toggle
    const [autoExpandDescriptions, setAutoExpandDescriptions] = useState(false);

    // Add state to track if component is mounted (for hydration safety)
    const [isMounted, setIsMounted] = useState(false);

    const { toast } = useToast();

    // Set mounted state after initial render
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Custom toast function with auto-dismiss after 3 seconds
    const showToast = useCallback(
        ({ title, description }: { title: string; description: string }) => {
            const { dismiss } = toast({ title, description });
            setTimeout(() => {
                dismiss();
            }, 3000);
        },
        [toast]
    );

    // Load AI summaries from the JSON file
    useEffect(() => {
        const loadSummaries = async () => {
            try {
                const response = await fetch("json/summaries-gemini.json");
                if (!response.ok) {
                    console.error("Failed to load AI summaries");
                    return;
                }
                const data: ISummaries = await response.json();
                setSummaries(data.summaries);
            } catch (error) {
                console.error("Error loading AI summaries:", error);
            }
        };

        loadSummaries();
    }, []);

    const toggleProgram = (programId: string) => {
        setSelectedPrograms((prev) => ({
            ...prev,
            [programId]: !prev[programId],
        }));
    };

    const filteredProjects = projects.filter((project) => {
        // Filter by selected programs
        const programMatch =
            filterMode === "union"
                ? project.programs.some(
                      (programId) => selectedPrograms[programId]
                  )
                : Object.keys(selectedPrograms)
                      .filter((programId) => selectedPrograms[programId])
                      .every((selectedProgramId) =>
                          project.programs.includes(selectedProgramId)
                      );

        const supervisorMatch =
            (Object.keys(selectedSupervisors).length === 0 &&
                Object.keys(excludedSupervisors).length === 0) ||
            (Object.keys(selectedSupervisors).length > 0
                ? selectedSupervisors[project.teacher]
                : !excludedSupervisors[project.teacher]);

        const typeMatch =
            projectTypeFilter === "all" || project.type === projectTypeFilter;

        // Filter by search query
        const searchMatch =
            searchQuery.toLowerCase() === "" ||
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.shortDescription
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            project.fullDescription
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

        // Filter by favorites
        const isFavorite = favorites.includes(project.title);
        let favoriteMatch = true;

        if (showFavorites) {
            // Show only favorites
            favoriteMatch = isFavorite;
        } else if (hideFavorites) {
            // Hide favorites
            favoriteMatch = !isFavorite;
        }

        // Filter by hidden status
        let hiddenStatusMatch = true;
        const isHidden = hiddenProjects.includes(project.title);
        if (isHidden && !showHiddenProjects) {
            hiddenStatusMatch = false;
        }

        let tildeltMatch = true;

        // Filter out tildelt
        if (showAvailableOnly) {
            tildeltMatch = !project.status.toLowerCase().includes("tildelt");
        }

        return (
            programMatch &&
            supervisorMatch &&
            typeMatch &&
            searchMatch &&
            favoriteMatch &&
            tildeltMatch &&
            hiddenStatusMatch
        );
    });

    const getProgramName = (programId: string) =>
        STUDY_PROGRAMS.find((p) => p.id === programId)?.name || programId;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    MSIT Master Proposals 2025
                </h1>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-8 w-8 text-yellow-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Project proposals can be registered from{" "}
                                <strong>April 1st</strong>.<br />
                                The deadline for submitting proposals are{" "}
                                <strong>May 21st</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1 space-y-6">
                    <StudyProgramFilter
                        programs={STUDY_PROGRAMS}
                        selectedPrograms={selectedPrograms}
                        onToggleProgram={toggleProgram}
                        filterMode={filterMode}
                        onFilterModeChange={setFilterMode}
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                            Other Options
                        </h3>
                        <div className="flex mt-2 flex-col space-y-2">
                            <div>
                                <input
                                    type="checkbox"
                                    id="show-favorites"
                                    checked={showFavorites}
                                    onChange={() => {
                                        setShowFavorites((prev) => !prev);
                                        if (!showFavorites) {
                                            // If enabling "show only favorites", disable "hide favorites"
                                            setHideFavorites(false);
                                        }
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="show-favorites"
                                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Show only favorites
                                </label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    id="hide-favorites"
                                    checked={hideFavorites}
                                    onChange={() => {
                                        setHideFavorites((prev) => !prev);
                                        if (!hideFavorites) {
                                            // If enabling "hide favorites", disable "show only favorites"
                                            setShowFavorites(false);
                                        }
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="hide-favorites"
                                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Hide favorites{" "}
                                    {isMounted &&
                                        favorites.length > 0 &&
                                        `(${favorites.length})`}
                                </label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    id="show-hidden"
                                    checked={showHiddenProjects}
                                    onChange={() =>
                                        setShowHiddenProjects((prev) => !prev)
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="show-hidden"
                                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Show hidden projects{" "}
                                    {isMounted &&
                                        hiddenProjects.length > 0 &&
                                        `(${hiddenProjects.length})`}
                                </label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    id="show-tildelt"
                                    checked={showAvailableOnly}
                                    onChange={() =>
                                        setShowTildelt((prev) => !prev)
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="show-tildelt"
                                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Show only available projects
                                </label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    id="auto-expand"
                                    checked={autoExpandDescriptions}
                                    onChange={() =>
                                        setAutoExpandDescriptions(
                                            (prev) => !prev
                                        )
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="auto-expand"
                                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Auto-expand all descriptions
                                </label>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    id="show-ai-summaries"
                                    checked={showAiSummaries}
                                    onChange={() =>
                                        setShowAiSummaries((prev) => !prev)
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="show-ai-summaries"
                                    className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Show AI summaries
                                </label>
                            </div>
                        </div>
                    </div>

                    <SupervisorFilter
                        supervisors={availableSupervisors}
                        selected={selectedSupervisors}
                        excluded={excludedSupervisors}
                        onToggle={(supervisor) => {
                            setSelectedSupervisors((prev) => ({
                                ...prev,
                                [supervisor]: !prev[supervisor],
                            }));
                            setExcludedSupervisors((prev) => {
                                const newExcluded = { ...prev };
                                delete newExcluded[supervisor];
                                return newExcluded;
                            });
                        }}
                        onExclude={(supervisor) => {
                            setExcludedSupervisors((prev) => ({
                                ...prev,
                                [supervisor]: true,
                            }));
                            setSelectedSupervisors((prev) => {
                                const newSelected = { ...prev };
                                delete newSelected[supervisor];
                                return newSelected;
                            });
                        }}
                        onClear={() => {
                            setSelectedSupervisors({});
                            setExcludedSupervisors({});
                        }}
                        loading={loading}
                    />
                </aside>

                <main className="lg:col-span-3">
                    <SortAndFilterControls
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        projectCount={filteredProjects.length}
                    />
                    <ProjectTypeFilter
                        value={projectTypeFilter}
                        onChange={setProjectTypeFilter}
                    />

                    {loading && <LoadingSkeleton count={5} />}
                    {error && (
                        <ErrorMessage message={error} onRetry={() => {}} />
                    )}

                    {!loading && !error && (
                        <div className="space-y-6">
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        getProgramName={getProgramName}
                                        isFavorite={favorites.includes(
                                            project.title
                                        )}
                                        onFavoriteToggle={() => {
                                            const isFavorite =
                                                favorites.includes(
                                                    project.title
                                                );
                                            setFavorites((prev) => {
                                                if (isFavorite) {
                                                    // Remove from favorites
                                                    showToast({
                                                        title: "Removed from favorites",
                                                        description: `"${project.title}" has been removed from your favorites.`,
                                                    });
                                                    return prev.filter(
                                                        (fav) =>
                                                            fav !==
                                                            project.title
                                                    );
                                                } else {
                                                    // Add to favorites
                                                    showToast({
                                                        title: "Added to favorites",
                                                        description: `"${project.title}" has been added to your favorites.`,
                                                    });
                                                    return [
                                                        ...prev,
                                                        project.title,
                                                    ];
                                                }
                                            });
                                        }}
                                        isHidden={hiddenProjects.includes(
                                            project.title
                                        )}
                                        onHideToggle={() => {
                                            const isHidden =
                                                hiddenProjects.includes(
                                                    project.title
                                                );
                                            setHiddenProjects((prev) => {
                                                if (isHidden) {
                                                    // Unhide project
                                                    showToast({
                                                        title: "Project unhidden",
                                                        description: `"${project.title}" is now visible in your project list.`,
                                                    });
                                                    return prev.filter(
                                                        (hidden) =>
                                                            hidden !==
                                                            project.title
                                                    );
                                                } else {
                                                    // Hide project
                                                    showToast({
                                                        title: "Project hidden",
                                                        description: `"${project.title}" has been hidden from your project list.`,
                                                    });
                                                    return [
                                                        ...prev,
                                                        project.title,
                                                    ];
                                                }
                                            });
                                        }}
                                        autoExpand={autoExpandDescriptions}
                                        aiSummary={
                                            showAiSummaries
                                                ? summaries[project.title]
                                                : undefined
                                        }
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                                        No projects found
                                    </h3>
                                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                                        Try adjusting your filters or search
                                        query.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
