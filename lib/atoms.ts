import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithStorage } from "jotai/utils";

// Selected programs atom with default value from constants
import { STUDY_PROGRAMS } from "./constants";
import { fetchProjects } from "./fetchProjects";

const DEFAULT_SELECTED_PROGRAMS = STUDY_PROGRAMS.reduce(
  (acc, program) => {
    acc[program.id] = true;
    return acc;
  },
  {} as Record<string, boolean>,
);

export const selectedProgramsAtom = atom<Record<string, boolean>>(
  DEFAULT_SELECTED_PROGRAMS,
);

// Atoms for project state
const _projectsDataAtom = atomWithQuery((get) => ({
  queryKey: ["projects", get(selectedProgramsAtom)],
  queryFn: async () => {
    return fetchProjects(get(selectedProgramsAtom));
  },
}));

export const availableSupervisorsAtom = atom<string[]>(
  (get) => get(_projectsDataAtom).data?.availableSupervisors || [],
);
export const loadingProjectsAtom = atom<boolean>(
  (get) => get(_projectsDataAtom).isLoading,
);
export const errorLoadingProjectsAtom = atom<string | null>(
  (get) => get(_projectsDataAtom).error?.message || null,
);
export const projectsAtom = atom(
  (get) => get(_projectsDataAtom).data?.projects || [],
);

// Interface for improved titles
export interface IImprovedTitles {
  titles: Record<string, { originalTitle: string; improvedTitle: string }>;
  originalDataFile: string;
  generatedAt: string;
  totalTitles: number;
}

// Function to fetch improved titles
async function fetchImprovedTitles(): Promise<
  Record<string, { originalTitle: string; improvedTitle: string }>
> {
  const response = await fetch("/json/titles-gemini.json");
  if (!response.ok) {
    throw new Error("Failed to load improved titles");
  }
  const data: IImprovedTitles = await response.json();
  return data.titles;
}

// Atoms for AI improved titles using atomWithQuery
const _improvedTitlesDataAtom = atomWithQuery(() => ({
  queryKey: ["improvedTitles"],
  queryFn: async () => {
    return fetchImprovedTitles();
  },
}));

// Derived atoms for improved titles
export const improvedTitlesAtom = atom<
  Record<string, { originalTitle: string; improvedTitle: string }>
>((get) => get(_improvedTitlesDataAtom).data || {});
export const improvedTitlesLoadingAtom = atom<boolean>(
  (get) => get(_improvedTitlesDataAtom).isLoading,
);
export const improvedTitlesErrorAtom = atom<string | null>(
  (get) => get(_improvedTitlesDataAtom).error?.message || null,
);
export const showImprovedTitlesAtom = atomWithStorage<boolean>(
  "show_improved_titles",
  false,
);

// Add showAiSummariesAtom for persisting AI summaries preference
export const showAiSummariesAtom = atomWithStorage<boolean>(
  "show_ai_summaries",
  false,
);

// Interface for summaries
export interface ISummaries {
  summaries: Record<string, string>;
  originalDataFile: string;
  generatedAt: string;
  totalSummaries: number;
}

// Function to fetch AI summaries
async function fetchSummaries(): Promise<Record<string, string>> {
  const response = await fetch("/json/summaries-gemini.json");
  if (!response.ok) {
    throw new Error("Failed to load AI summaries");
  }
  const data: ISummaries = await response.json();
  return data.summaries;
}

// Atoms for AI summaries using atomWithQuery
const _summariesDataAtom = atomWithQuery(() => ({
  queryKey: ["summaries"],
  queryFn: async () => {
    return fetchSummaries();
  },
}));

// Derived atoms for summaries
export const summariesAtom = atom<Record<string, string>>(
  (get) => get(_summariesDataAtom).data || {},
);
export const summariesLoadingAtom = atom<boolean>(
  (get) => get(_summariesDataAtom).isLoading,
);
export const summariesErrorAtom = atom<string | null>(
  (get) => get(_summariesDataAtom).error?.message || null,
);

// ELO rating state for project comparisons
export interface ProjectsEloState {
  ratings: Record<string, number>;
  comparisonCount: number;
}

export const projectsEloAtom = atomWithStorage<ProjectsEloState>(
  "projects_elo",
  {
    ratings: {},
    comparisonCount: 0,
  },
);
