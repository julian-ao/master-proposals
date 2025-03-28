"use client";
import { useAtom } from "jotai";
import { useEffect } from "react";
import {
    improvedTitlesAtom,
    improvedTitlesLoadingAtom,
    improvedTitlesErrorAtom,
    IImprovedTitles,
} from "@/lib/atoms";

export function ImprovedTitlesProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [improvedTitles, setImprovedTitles] = useAtom(improvedTitlesAtom);
    const [loading, setLoading] = useAtom(improvedTitlesLoadingAtom);
    const [error, setError] = useAtom(improvedTitlesErrorAtom);

    useEffect(() => {
        // Only fetch once
        if (
            Object.keys(improvedTitles).length > 0 ||
            loading ||
            error !== null
        ) {
            return;
        }

        async function fetchImprovedTitles() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/json/titles-gemini.json");
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }

                const data: IImprovedTitles = await response.json();
                if (data && data.titles) {
                    setImprovedTitles(data.titles);
                    console.log(
                        `Loaded ${
                            Object.keys(data.titles).length
                        } improved titles`
                    );
                } else {
                    throw new Error("Invalid improved titles data format");
                }
            } catch (err) {
                console.error("Error loading improved titles:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unknown error loading improved titles"
                );
            } finally {
                setLoading(false);
            }
        }

        fetchImprovedTitles();
    }, [
        improvedTitles,
        loading,
        error,
        setImprovedTitles,
        setLoading,
        setError,
    ]);

    return <>{children}</>;
}
