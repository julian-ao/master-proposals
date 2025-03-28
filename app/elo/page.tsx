"use client";

import {
    errorAtom,
    loadingProjectsAtom,
    projectsAtom,
    summariesAtom,
    projectsEloAtom,
    improvedTitlesAtom,
    showImprovedTitlesAtom,
} from "@/lib/atoms";
import { useAtom, useAtomValue } from "jotai";
import { RESET } from "jotai/utils";
import { useLocalStorage } from "usehooks-ts";
import { useEffect, useState } from "react";
import { IProject, STUDY_PROGRAMS } from "@/lib/constants";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    ArrowDownIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectComparisonCard } from "@/components/ProjectComparisonCard";
import { useToast } from "@/hooks/use-toast";

// Function to calculate new ELO ratings
function calculateElo(
    ratingA: number,
    ratingB: number,
    result: "A" | "B" | "DRAW"
): { newRatingA: number; newRatingB: number } {
    const K = 32; // K-factor determines how much ratings change

    // Expected score calculation based on ELO formula
    const expectedScoreA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
    const expectedScoreB = 1 / (1 + 10 ** ((ratingA - ratingB) / 400));

    let scoreA = 0;
    let scoreB = 0;

    if (result === "A") {
        scoreA = 1;
        scoreB = 0;
    } else if (result === "B") {
        scoreA = 0;
        scoreB = 1;
    } else {
        // Draw
        scoreA = 0.5;
        scoreB = 0.5;
    }

    // Calculate new ratings
    const newRatingA = Math.round(ratingA + K * (scoreA - expectedScoreA));
    const newRatingB = Math.round(ratingB + K * (scoreB - expectedScoreB));

    return { newRatingA, newRatingB };
}

export default function Page() {
    const projects = useAtomValue(projectsAtom);
    const loading = useAtomValue(loadingProjectsAtom);
    const error = useAtomValue(errorAtom);
    const summaries = useAtomValue(summariesAtom);
    const improvedTitles = useAtomValue(improvedTitlesAtom);
    const [showImprovedTitles, setShowImprovedTitles] = useAtom(
        showImprovedTitlesAtom
    );
    const isMobile = useIsMobile();
    const { toast } = useToast();

    const [projectsElo, setProjectsElo] = useAtom(projectsEloAtom);
    const [favorites, setFavorites] = useLocalStorage<string[]>(
        "favorites",
        []
    );
    const [projectA, setProjectA] = useState<IProject | null>(null);
    const [projectB, setProjectB] = useState<IProject | null>(null);

    // Add state for showing full descriptions and AI summaries
    const [showFullDescriptions, setShowFullDescriptions] = useState(false);
    const [showAiSummaries, setShowAiSummaries] = useState(false);

    // Function to get program name from program ID
    const getProgramName = (programId: string): string => {
        const program = STUDY_PROGRAMS.find((p) => p.id === programId);
        return program ? program.name : programId;
    };

    // Get projects by favorite titles
    const favoriteProjects = projects.filter((p) =>
        favorites.includes(p.title)
    );

    // Handle unfavoriting a project
    const handleUnfavorite = (projectTitle: string) => {
        // Remove the project from favorites
        const newFavorites = favorites.filter(
            (title) => title !== projectTitle
        );
        setFavorites(newFavorites);

        // Show toast notification
        toast({
            title: "Project unfavorited",
            description: "The project has been removed from your favorites",
        });

        // Select new projects for comparison
        selectRandomProjects();
    };

    // Select projects for comparison with a bias toward higher-rated projects
    const selectRandomProjects = () => {
        if (favoriteProjects.length < 2) return;

        // Map projects with their ELO ratings
        const projectsWithElo = favoriteProjects.map((project) => ({
            project,
            elo: projectsElo.ratings[project.title] || 1000,
        }));

        // Sort projects by ELO rating in descending order
        const sortedProjects = [...projectsWithElo].sort(
            (a, b) => b.elo - a.elo
        );

        // Function to select a project with bias toward higher-rated projects
        const selectWithBias = (excludeIndex = -1) => {
            // Calculate total weight (higher ELO = higher chance of selection)
            // The power function creates a stronger bias toward higher-rated projects
            const totalWeight = sortedProjects.reduce(
                (sum, _, i) =>
                    i !== excludeIndex
                        ? sum + Math.pow(sortedProjects.length - i, 1.5)
                        : sum,
                0
            );

            let randomWeight = Math.random() * totalWeight;
            let selectedIndex = 0;

            // Select a project based on weighted probability
            for (let i = 0; i < sortedProjects.length; i++) {
                if (i === excludeIndex) continue;

                const weight = Math.pow(sortedProjects.length - i, 1.5);
                randomWeight -= weight;

                if (randomWeight <= 0) {
                    selectedIndex = i;
                    break;
                }
            }

            return {
                index: selectedIndex,
                project: sortedProjects[selectedIndex].project,
            };
        };

        // Select first project with bias
        const firstSelection = selectWithBias();

        // Select second project with bias, excluding the first one
        const secondSelection = selectWithBias(firstSelection.index);

        setProjectA(firstSelection.project);
        setProjectB(secondSelection.project);
    };

    const resetElo = () => {
        setProjectsElo(RESET);
    };

    // Initialize ELO ratings for new projects
    useEffect(() => {
        if (favoriteProjects.length > 0) {
            const updatedElo = { ...projectsElo.ratings };
            let hasChanges = false;

            favoriteProjects.forEach((project) => {
                if (updatedElo[project.title] === undefined) {
                    updatedElo[project.title] = 1000; // Starting ELO
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                setProjectsElo((prev) => ({
                    ...prev,
                    ratings: updatedElo,
                }));
            }

            // Select initial projects for comparison
            if (!projectA || !projectB) {
                selectRandomProjects();
            }
        }
    }, [favoriteProjects, projectsElo, setProjectsElo, projectA, projectB]);

    // Handle user selection
    const handleSelection = (result: "A" | "B" | "DRAW") => {
        if (!projectA || !projectB) return;

        const ratingA = projectsElo.ratings[projectA.title] || 1000;
        const ratingB = projectsElo.ratings[projectB.title] || 1000;

        const { newRatingA, newRatingB } = calculateElo(
            ratingA,
            ratingB,
            result
        );

        // Update ELO ratings
        setProjectsElo((prev) => ({
            ...prev,
            ratings: {
                ...prev.ratings,
                [projectA.title]: newRatingA,
                [projectB.title]: newRatingB,
            },
            comparisonCount: prev.comparisonCount + 1,
        }));

        // Select new projects for comparison
        selectRandomProjects();
    };

    // Sort projects by ELO rating for leaderboard
    const sortedProjects = favoriteProjects
        .map((project) => ({
            ...project,
            elo: projectsElo.ratings[project.title] || 1000,
        }))
        .sort((a, b) => b.elo - a.elo);

    if (loading) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    ELO Comparison
                </h1>
                <p>Loading projects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    ELO Comparison
                </h1>
                <p className="text-red-500">Error: {error}</p>
            </div>
        );
    }

    if (favoriteProjects.length < 2) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    ELO Comparison
                </h1>
                <p>Please favorite at least 2 projects to use this feature.</p>
                <p className="mt-4">
                    <a href="/" className="text-blue-600 hover:underline">
                        Back to project list
                    </a>
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                ELO Comparison
            </h1>

            {/* Backlink to main page */}
            <div className="flex justify-center mb-8">
                <a
                    href="/"
                    className="flex items-center text-blue-600 hover:text-blue-800 transition"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Back to Projects
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Leaderboard - full width on mobile, 1/3 width on desktop */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 order-2 md:order-1">
                    <h2 className="text-2xl font-semibold mb-4 text-center">
                        Leaderboard
                    </h2>
                    <div className="flex flex-col items-center mb-6">
                        <p className="text-sm text-gray-500 mb-4 text-center">
                            Comparisons: {projectsElo.comparisonCount}
                        </p>
                        <button
                            onClick={resetElo}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
                        >
                            Reset ELO
                        </button>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedProjects.map((project, index) => (
                            <div
                                key={project.id}
                                className="py-3 flex justify-between items-start"
                            >
                                <div className="flex items-start">
                                    <span className="text-gray-500 mr-3 font-semibold">
                                        {index + 1}.
                                    </span>
                                    <div className="flex flex-col">
                                        {showImprovedTitles &&
                                            improvedTitles[project.id]
                                                ?.improvedTitle && (
                                                <span className="font-medium break-words pr-2 text-teal-600 dark:text-teal-400 text-sm">
                                                    {
                                                        improvedTitles[
                                                            project.id
                                                        ].improvedTitle
                                                    }
                                                </span>
                                            )}
                                        <a
                                            href={
                                                "https://www.idi.ntnu.no/education/" +
                                                project.link
                                            }
                                            className={`font-medium break-words pr-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline ${
                                                showImprovedTitles &&
                                                improvedTitles[project.id]
                                                    ?.improvedTitle
                                                    ? "text-xs text-gray-500 dark:text-gray-400"
                                                    : ""
                                            }`}
                                            style={{ wordBreak: "break-word" }}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {project.title}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-blue-600 font-semibold">
                                        {project.elo}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleUnfavorite(project.title)
                                        }
                                        className="text-gray-400 hover:text-red-500 transition"
                                        title="Unfavorite project"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison Cards - full width on mobile, 2/3 width on desktop */}
                <div className="md:col-span-2 flex flex-col order-1 md:order-2 mb-8 md:mb-0">
                    <h2 className="text-2xl font-semibold mb-4 text-center">
                        Which project do you prefer?
                    </h2>

                    {/* Display options - more compact on mobile */}
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="show-full-descriptions"
                                checked={showFullDescriptions}
                                onChange={() =>
                                    setShowFullDescriptions((prev) => !prev)
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="show-full-descriptions"
                                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                                Show full descriptions
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="show-ai-summaries"
                                checked={showAiSummaries}
                                onChange={() =>
                                    setShowAiSummaries((prev) => !prev)
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="show-ai-summaries"
                                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                                Show AI summaries
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="show-improved-titles-elo"
                                checked={showImprovedTitles}
                                onChange={() =>
                                    setShowImprovedTitles((prev) => !prev)
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="show-improved-titles-elo"
                                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                                Show AI improved titles
                            </label>
                        </div>
                    </div>

                    {/* Draw and Skip buttons row - adaptable to mobile */}
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        <button
                            onClick={() => handleSelection("DRAW")}
                            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-md transition"
                        >
                            It's a Draw
                        </button>

                        <button
                            onClick={selectRandomProjects}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-6 rounded-md transition"
                        >
                            Skip Comparison
                        </button>
                    </div>

                    {/* Prefer buttons in full-width columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <button
                            onClick={() => handleSelection("A")}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition flex items-center justify-center"
                        >
                            {isMobile ? (
                                <ArrowUpIcon className="h-5 w-5 mr-2" />
                            ) : (
                                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            )}
                            {isMobile ? "Prefer First" : "Prefer Left Project"}
                        </button>

                        <button
                            onClick={() => handleSelection("B")}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition flex items-center justify-center"
                        >
                            {isMobile
                                ? "Prefer Second"
                                : "Prefer Right Project"}
                            {isMobile ? (
                                <ArrowDownIcon className="h-5 w-5 ml-2" />
                            ) : (
                                <ArrowRightIcon className="h-5 w-5 ml-2" />
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Project A */}
                        {projectA && (
                            <ProjectComparisonCard
                                project={projectA}
                                showFullDescriptions={showFullDescriptions}
                                showAiSummaries={showAiSummaries}
                                summaries={summaries}
                                eloRating={
                                    projectsElo.ratings[projectA.title] || 1000
                                }
                                onUnfavorite={() =>
                                    handleUnfavorite(projectA.title)
                                }
                                getProgramName={getProgramName}
                                improvedTitle={
                                    improvedTitles[projectA.id]?.improvedTitle
                                }
                                showImprovedTitle={showImprovedTitles}
                            />
                        )}

                        {/* Project B */}
                        {projectB && (
                            <ProjectComparisonCard
                                project={projectB}
                                showFullDescriptions={showFullDescriptions}
                                showAiSummaries={showAiSummaries}
                                summaries={summaries}
                                eloRating={
                                    projectsElo.ratings[projectB.title] || 1000
                                }
                                onUnfavorite={() =>
                                    handleUnfavorite(projectB.title)
                                }
                                getProgramName={getProgramName}
                                improvedTitle={
                                    improvedTitles[projectB.id]?.improvedTitle
                                }
                                showImprovedTitle={showImprovedTitles}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
