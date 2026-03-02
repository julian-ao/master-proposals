"use client";

import { DarkModeToggle } from "@/components/DarkModeToggle";
import { ProjectComparisonCard } from "@/components/ProjectComparisonCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  errorLoadingProjectsAtom,
  improvedTitlesAtom,
  loadingProjectsAtom,
  projectsAtom,
  projectsEloAtom,
  showAiSummariesAtom,
  showImprovedTitlesAtom,
  summariesAtom,
} from "@/lib/atoms";
import { IProject, STUDY_PROGRAMS } from "@/lib/constants";
import { useAtom, useAtomValue } from "jotai";
import { RESET } from "jotai/utils";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

// Function to calculate new ELO ratings
function calculateElo(
  ratingA: number,
  ratingB: number,
  result: "A" | "B" | "DRAW",
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
  const error = useAtomValue(errorLoadingProjectsAtom);
  const summaries = useAtomValue(summariesAtom);
  const improvedTitles = useAtomValue(improvedTitlesAtom);
  const [showImprovedTitles, setShowImprovedTitles] = useAtom(
    showImprovedTitlesAtom,
  );
  const [showAiSummaries, setShowAiSummaries] = useAtom(showAiSummariesAtom);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [projectsElo, setProjectsElo] = useAtom(projectsEloAtom);
  const [favorites, setFavorites] = useLocalStorage<string[]>("favorites", []);
  const [projectA, setProjectA] = useState<IProject | null>(null);
  const [projectB, setProjectB] = useState<IProject | null>(null);

  // Add state for showing full descriptions and AI summaries
  const [showFullDescriptions, setShowFullDescriptions] = useState(false);

  // Function to get program name from program ID
  const getProgramName = (programId: string): string => {
    const program = STUDY_PROGRAMS.find((p) => p.id === programId);
    return program ? program.name : programId;
  };

  // Get projects by favorite titles
  const favoriteProjects = projects.filter((p) => favorites.includes(p.title));

  // Handle unfavoriting a project
  const handleUnfavorite = (projectTitle: string) => {
    // Remove the project from favorites
    const newFavorites = favorites.filter((title) => title !== projectTitle);
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
    const sortedProjects = [...projectsWithElo].sort((a, b) => b.elo - a.elo);

    // Function to select a project with bias toward higher-rated projects
    const selectWithBias = (excludeIndex = -1) => {
      // Calculate total weight (higher ELO = higher chance of selection)
      // The power function creates a stronger bias toward higher-rated projects
      const totalWeight = sortedProjects.reduce(
        (sum, _, i) =>
          i !== excludeIndex
            ? sum + Math.pow(sortedProjects.length - i, 1.5)
            : sum,
        0,
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

    const { newRatingA, newRatingB } = calculateElo(ratingA, ratingB, result);

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
      <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">
          ELO <span className="text-indigo-600 dark:text-indigo-400">Comparison</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">
          ELO <span className="text-indigo-600 dark:text-indigo-400">Comparison</span>
        </h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (favoriteProjects.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">
          ELO <span className="text-indigo-600 dark:text-indigo-400">Comparison</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Please favorite at least 2 projects to use this feature.</p>
        <p className="mt-4">
          <a href="/" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium underline underline-offset-2 transition-colors">
            Back to project list
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-10">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </a>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
          Rank Your <span className="text-indigo-600 dark:text-indigo-400">Favorites</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Compare two projects at a time. Pick the one you prefer and we&apos;ll build your personal ranking.
        </p>
      </div>

      {/* Main comparison area — full width, the star of the show */}
      <div className="mb-10">
        {/* The two project cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {projectA && (
            <ProjectComparisonCard
              project={projectA}
              showFullDescriptions={showFullDescriptions}
              showAiSummaries={showAiSummaries}
              summaries={summaries}
              eloRating={projectsElo.ratings[projectA.title] || 1000}
              onUnfavorite={() => handleUnfavorite(projectA.title)}
              getProgramName={getProgramName}
              improvedTitle={improvedTitles[projectA.id]?.improvedTitle}
              showImprovedTitle={showImprovedTitles}
            />
          )}

          {projectB && (
            <ProjectComparisonCard
              project={projectB}
              showFullDescriptions={showFullDescriptions}
              showAiSummaries={showAiSummaries}
              summaries={summaries}
              eloRating={projectsElo.ratings[projectB.title] || 1000}
              onUnfavorite={() => handleUnfavorite(projectB.title)}
              getProgramName={getProgramName}
              improvedTitle={improvedTitles[projectB.id]?.improvedTitle}
              showImprovedTitle={showImprovedTitles}
            />
          )}
        </div>

        {/* Action buttons — directly below the cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => handleSelection("A")}
            className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center justify-center"
          >
            {isMobile ? (
              <ArrowUpIcon className="h-4 w-4 mr-1.5" />
            ) : (
              <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            )}
            {isMobile ? "First" : "Left"}
          </button>
          <button
            onClick={() => handleSelection("DRAW")}
            className="text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Draw
          </button>
          <button
            onClick={selectRandomProjects}
            className="text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => handleSelection("B")}
            className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center justify-center"
          >
            {isMobile ? "Second" : "Right"}
            {isMobile ? (
              <ArrowDownIcon className="h-4 w-4 ml-1.5" />
            ) : (
              <ArrowRightIcon className="h-4 w-4 ml-1.5" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom section: Leaderboard + Settings side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leaderboard — takes 2/3 */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Your Ranking
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {projectsElo.comparisonCount} comparisons
              </span>
              <button
                onClick={resetElo}
                className="text-xs font-medium text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedProjects.map((project, index) => (
              <div
                key={project.id}
                className="py-2.5 flex justify-between items-start"
              >
                <div className="flex items-start min-w-0">
                  <span className="text-xs text-gray-400 mr-2 font-semibold mt-0.5 flex-shrink-0 w-5 text-right">
                    {index + 1}.
                  </span>
                  <div className="flex flex-col min-w-0">
                    {showImprovedTitles &&
                      improvedTitles[project.id]?.improvedTitle && (
                        <span className="font-medium break-words pr-2 text-teal-600 dark:text-teal-400 text-xs">
                          {improvedTitles[project.id].improvedTitle}
                        </span>
                      )}
                    <a
                      href={"https://www.idi.ntnu.no/education/" + project.link}
                      className={`font-medium break-words pr-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                        showImprovedTitles &&
                        improvedTitles[project.id]?.improvedTitle
                          ? "text-xs text-gray-400 dark:text-gray-500"
                          : "text-sm text-gray-700 dark:text-gray-300"
                      }`}
                      style={{ wordBreak: "break-word" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.title}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {project.elo}
                  </span>
                  <button
                    onClick={() => handleUnfavorite(project.title)}
                    className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                    title="Remove from ranking"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display Settings — takes 1/3, tucked away */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Display
          </h3>
          <div className="flex flex-col space-y-3">
            <DarkModeToggle />
            <label htmlFor="show-full-descriptions" className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                id="show-full-descriptions"
                checked={showFullDescriptions}
                onChange={() => setShowFullDescriptions((prev) => !prev)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/25"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                Full descriptions
              </span>
            </label>
            <label htmlFor="show-ai-summaries-elo" className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                id="show-ai-summaries-elo"
                checked={showAiSummaries}
                onChange={() => setShowAiSummaries((prev) => !prev)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/25"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                AI summaries
              </span>
            </label>
            <label htmlFor="show-improved-titles-elo" className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                id="show-improved-titles-elo"
                checked={showImprovedTitles}
                onChange={() => setShowImprovedTitles((prev) => !prev)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/25"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                AI improved titles
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
