"use client";

import { useSetAtom } from "jotai";
import { ReactNode, useEffect } from "react";
import {
    summariesAtom,
    summariesLoadingAtom,
    summariesErrorAtom,
    ISummaries,
} from "../lib/atoms";

export function AISummaryProvider({ children }: { children: ReactNode }) {
    const setSummaries = useSetAtom(summariesAtom);
    const setLoading = useSetAtom(summariesLoadingAtom);
    const setError = useSetAtom(summariesErrorAtom);

    useEffect(() => {
        const loadSummaries = async () => {
            setLoading(true);
            try {
                const response = await fetch("json/summaries-gemini.json");
                if (!response.ok) {
                    throw new Error("Failed to load AI summaries");
                }
                const data: ISummaries = await response.json();
                setSummaries(data.summaries);
                setError(null);
            } catch (error) {
                console.error("Error loading AI summaries:", error);
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error loading summaries"
                );
            } finally {
                setLoading(false);
            }
        };

        loadSummaries();
    }, [setSummaries, setLoading, setError]);

    return <>{children}</>;
}
