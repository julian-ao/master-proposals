"use client";

import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectTypeFilter } from "../components/ProjectTypeFilter";
import { SortAndFilterControls } from "../components/SortAndFilterControls";
import { StudyProgramFilter } from "../components/StudyProgramFilter";
import { SupervisorFilter } from "../components/SupervisorFilter";
import { useToast } from "../hooks/use-toast";
import {
  availableSupervisorsAtom,
  errorLoadingProjectsAtom,
  improvedTitlesAtom,
  loadingProjectsAtom,
  projectsAtom,
  selectedProgramsAtom,
  showAiSummariesAtom,
  showImprovedTitlesAtom,
  summariesAtom,
} from "../lib/atoms";
import { IProject, STUDY_PROGRAMS } from "../lib/constants";

export default function ProjectBrowser() {
  const [selectedPrograms, setSelectedPrograms] = useAtom(selectedProgramsAtom);
  const projects = useAtomValue(projectsAtom);
  const loading = useAtomValue(loadingProjectsAtom);
  const error = useAtomValue(errorLoadingProjectsAtom);
  const availableSupervisors = useAtomValue(availableSupervisorsAtom);
  const summaries = useAtomValue(summariesAtom);
  const improvedTitles = useAtomValue(improvedTitlesAtom);
  const [showImprovedTitles, setShowImprovedTitles] = useAtom(
    showImprovedTitlesAtom,
  );
  const [showAiSummaries, setShowAiSummaries] = useAtom(showAiSummariesAtom);

  const [filterMode, setFilterMode] = useState<"union" | "intersection">(
    "union",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState<
    "all" | "single" | "duo"
  >("all");

  // Add state for major course filter
  const [majorCourseFilter, setMajorCourseFilter] = useState<
    "all" | "computerScience" | "informatics" | "exclusive"
  >("all");

  // Add state for project ID sorting
  const [sortByProjectId, setSortByProjectId] = useState<
    "alpha" | "asc" | "desc"
  >("alpha");

  const [selectedSupervisors, setSelectedSupervisors] = useState<
    Record<string, boolean>
  >({});
  const [excludedSupervisors, setExcludedSupervisors] = useState<
    Record<string, boolean>
  >({});

  const [showFavorites, setShowFavorites] = useState(false);
  const [hideFavorites, setHideFavorites] = useState(false);

  const [favorites, setFavorites] = useLocalStorage<string[]>("favorites", []);

  // Add state for hidden projects
  const [hiddenProjects, setHiddenProjects] = useLocalStorage<string[]>(
    "hiddenProjects",
    [],
  );
  const [showHiddenProjects, setShowHiddenProjects] = useState(false);

  const [showAvailableOnly, setShowTildelt] = useState(false);

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
    [toast],
  );

  const toggleProgram = (programId: string) => {
    setSelectedPrograms((prev) => ({
      ...prev,
      [programId]: !prev[programId],
    }));
  };

  // Helper function to determine if a project is exclusive to a specific major course
  const isProjectExclusiveToMajorCourse = (
    project: IProject,
    majorCourse: string,
  ): boolean => {
    // Get all program IDs for the specified major course
    const majorCoursePrograms = STUDY_PROGRAMS.filter(
      (program) => program.majorCourse === majorCourse,
    ).map((program) => program.id);

    // Check if the project has at least one program from the major course
    const hasCurrentMajorCourse = project.programs.some((programId) =>
      majorCoursePrograms.includes(programId),
    );

    // Get all program IDs for the other major courses
    const otherMajorCoursePrograms = STUDY_PROGRAMS.filter(
      (program) => program.majorCourse !== majorCourse,
    ).map((program) => program.id);

    // Check if the project has no programs from other major courses
    const hasNoOtherMajorCourses = !project.programs.some((programId) =>
      otherMajorCoursePrograms.includes(programId),
    );

    // A project is exclusive to a major course if it has programs from that course
    // and has no programs from other major courses
    return hasCurrentMajorCourse && hasNoOtherMajorCourses;
  };

  const filteredProjects = projects.filter((project) => {
    // Filter by selected programs
    const programMatch =
      filterMode === "union"
        ? project.programs.some((programId) => selectedPrograms[programId])
        : Object.keys(selectedPrograms)
          .filter((programId) => selectedPrograms[programId])
          .every((selectedProgramId) =>
            project.programs.includes(selectedProgramId),
          );

    // Filter by supervisor
    const supervisorMatch =
      (Object.keys(selectedSupervisors).length === 0 &&
        Object.keys(excludedSupervisors).length === 0) ||
      (Object.keys(selectedSupervisors).length > 0
        ? selectedSupervisors[project.teacher]
        : !excludedSupervisors[project.teacher]);

    // Filter by project type
    const typeMatch =
      projectTypeFilter === "all" || project.type === projectTypeFilter;

    // Filter by major course exclusivity
    let majorCourseMatch = true;
    if (majorCourseFilter === "computerScience") {
      majorCourseMatch = isProjectExclusiveToMajorCourse(
        project,
        "computerScience",
      );
    } else if (majorCourseFilter === "informatics") {
      majorCourseMatch = isProjectExclusiveToMajorCourse(
        project,
        "informatics",
      );
    } else if (majorCourseFilter === "exclusive") {
      // For "exclusive" option, we want projects that are exclusive to either major course
      majorCourseMatch =
        isProjectExclusiveToMajorCourse(project, "computerScience") ||
        isProjectExclusiveToMajorCourse(project, "informatics");
    }

    // Filter by search query
    const searchMatch =
      searchQuery.toLowerCase() === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.shortDescription
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      project.fullDescription.toLowerCase().includes(searchQuery.toLowerCase());

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
      hiddenStatusMatch &&
      majorCourseMatch
    );
  });

  // Apply sorting by project ID or title
  const sortedProjects = [...filteredProjects];

  sortedProjects.sort((a, b) => {
    if (sortByProjectId === "alpha") {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    } else if (sortByProjectId === "asc") {
      return parseInt(a.id) - parseInt(b.id);
    } else if (sortByProjectId === "desc") {
      return parseInt(b.id) - parseInt(a.id);
    }
    return 0;
  });

  const getProgramName = (programId: string) =>
    STUDY_PROGRAMS.find((p) => p.id === programId)?.name || programId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          IDI Master Proposals {new Date(Date.now()).getFullYear()}
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

        {/* ELO Ranking Link */}
        {isMounted && favorites.length >= 2 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You have {favorites.length} favorited projects! Compare them
                  and create your personal ranking.
                </p>
                <p className="mt-1">
                  <a
                    href="/elo"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Go to ELO Ranking →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <StudyProgramFilter
            programs={STUDY_PROGRAMS}
            selectedPrograms={selectedPrograms}
            onToggleProgram={toggleProgram}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            majorCourseFilter={majorCourseFilter}
            onMajorCourseFilterChange={setMajorCourseFilter}
          />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Other Options
            </h3>
            <div className="flex mt-2 flex-col space-y-2">
              <DarkModeToggle />
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
                  {isMounted && favorites.length > 0 && `(${favorites.length})`}
                </label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="show-hidden"
                  checked={showHiddenProjects}
                  onChange={() => setShowHiddenProjects((prev) => !prev)}
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
                  onChange={() => setShowTildelt((prev) => !prev)}
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
                  onChange={() => setAutoExpandDescriptions((prev) => !prev)}
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
                  onChange={() => setShowAiSummaries((prev) => !prev)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="show-ai-summaries"
                  className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  Show AI summaries
                </label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="show-improved-titles"
                  checked={showImprovedTitles}
                  onChange={() => setShowImprovedTitles((prev) => !prev)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="show-improved-titles"
                  className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  Show AI improved titles
                </label>
              </div>
            </div>
          </div>

          <SupervisorFilter
            supervisors={availableSupervisors}
            selected={selectedSupervisors}
            excluded={excludedSupervisors}
            onToggle={(supervisor) => {
              setSelectedSupervisors((prev) => {
                const newSelected = { ...prev };
                if (prev[supervisor]) {
                  delete newSelected[supervisor];
                } else {
                  newSelected[supervisor] = true;
                }
                return newSelected;
              });
              setExcludedSupervisors((prev) => {
                const newExcluded = { ...prev };
                delete newExcluded[supervisor];
                return newExcluded;
              });
            }}
            onExclude={(supervisor) => {
              setExcludedSupervisors((prev) => ({
                ...prev,
                [supervisor]: !prev[supervisor],
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
            sortByProjectId={sortByProjectId}
            onSortByProjectIdChange={setSortByProjectId}
          />
          <ProjectTypeFilter
            value={projectTypeFilter}
            onChange={setProjectTypeFilter}
          />

          {loading && <LoadingSkeleton count={5} />}
          {error && <ErrorMessage message={error} onRetry={() => { }} />}

          {!loading && !error && (
            <div className="space-y-6">
              {sortedProjects.length > 0 ? (
                sortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    getProgramName={getProgramName}
                    isFavorite={favorites.includes(project.title)}
                    onFavoriteToggle={() => {
                      const isFavorite = favorites.includes(project.title);
                      setFavorites((prev) => {
                        if (isFavorite) {
                          // Remove from favorites
                          showToast({
                            title: "Removed from favorites",
                            description: `"${project.title}" has been removed from your favorites.`,
                          });
                          return prev.filter((fav) => fav !== project.title);
                        } else {
                          // Add to favorites
                          showToast({
                            title: "Added to favorites",
                            description: `"${project.title}" has been added to your favorites.`,
                          });
                          return [...prev, project.title];
                        }
                      });
                    }}
                    isHidden={hiddenProjects.includes(project.title)}
                    onHideToggle={() => {
                      const isHidden = hiddenProjects.includes(project.title);
                      setHiddenProjects((prev) => {
                        if (isHidden) {
                          // Unhide project
                          showToast({
                            title: "Project unhidden",
                            description: `"${project.title}" is now visible in your project list.`,
                          });
                          return prev.filter(
                            (hidden) => hidden !== project.title,
                          );
                        } else {
                          // Hide project
                          showToast({
                            title: "Project hidden",
                            description: `"${project.title}" has been hidden from your project list.`,
                          });
                          return [...prev, project.title];
                        }
                      });
                    }}
                    autoExpand={autoExpandDescriptions}
                    aiSummary={
                      showAiSummaries
                        ? summaries[project.id]?.summary
                        : undefined
                    }
                    improvedTitle={improvedTitles[project.id]?.improvedTitle}
                    showImprovedTitle={showImprovedTitles}
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
                    Try adjusting your filters or search query.
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
