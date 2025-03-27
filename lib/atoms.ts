import { atom } from "jotai";
import { IProject } from "./constants";

// Atoms for project state
export const projectsAtom = atom<IProject[]>([]);
export const availableSupervisorsAtom = atom<string[]>([]);
export const loadingProjectsAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

// Selected programs atom with default value from constants
import { STUDY_PROGRAMS } from "./constants";

const DEFAULT_SELECTED_PROGRAMS = STUDY_PROGRAMS.reduce((acc, program) => {
    acc[program.id] = true;
    return acc;
}, {} as Record<string, boolean>);

export const selectedProgramsAtom = atom<Record<string, boolean>>(
    DEFAULT_SELECTED_PROGRAMS
);

// Fetched state atom to track if the initial fetch has been done
export const projectsFetchedAtom = atom<boolean>(false);

// Interface for summaries
export interface ISummaries {
    summaries: Record<string, string>;
    originalDataFile: string;
    generatedAt: string;
    totalSummaries: number;
}

// Atoms for AI summaries
export const summariesAtom = atom<Record<string, string>>({});
export const summariesLoadingAtom = atom<boolean>(false);
export const summariesErrorAtom = atom<string | null>(null);
export const showAiSummariesAtom = atom<boolean>(false);
