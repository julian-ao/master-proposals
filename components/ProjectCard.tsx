import { useState, useEffect } from "react";
import { IProject } from "../lib/constants";
import { track } from "@vercel/analytics";

// Helper function to format AI summary text
function formatAiSummary(summary: string): string {
    if (!summary) return "";

    // Remove the introductory text before the actual summary
    let cleanSummary = summary.replace(/^Okay,.*?summary.*?:\s*\n\n/i, "");

    // Format markdown bold text to HTML
    cleanSummary = cleanSummary.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-indigo-700 dark:text-indigo-300">$1</strong>'
    );

    // Handle paragraph breaks
    cleanSummary = cleanSummary.replace(/\n\n/g, "<br/><br/>");

    // Remove any remaining markdown artifacts
    cleanSummary = cleanSummary.replace(/\n/g, " ");

    return cleanSummary;
}

interface ProjectCardProps {
    project: IProject;
    getProgramName: (programId: string) => string;
    onFavoriteToggle?: () => void;
    isFavorite?: boolean;
    onHideToggle?: () => void;
    isHidden?: boolean;
    autoExpand?: boolean;
    aiSummary?: string;
}

export function ProjectCard({
    project,
    getProgramName,
    onFavoriteToggle,
    isFavorite,
    onHideToggle,
    isHidden,
    autoExpand = false,
    aiSummary,
}: ProjectCardProps) {
    const [expanded, setExpanded] = useState(autoExpand);

    // Update expanded state when autoExpand changes
    useEffect(() => {
        setExpanded(autoExpand);
    }, [autoExpand]);

    const programColors: Record<string, string> = {
        p2_6: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        p2_7: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        p2_9: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        p2_10: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {project.title}
                    </h3>
                    <button
                        onClick={() => {
                            track("My Event", {}, { flags: ["summer-sale"] });
                            setExpanded(!expanded);
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {expanded ? "Hide details" : "Show details"}
                    </button>
                </div>

                {/* AI Summary - displayed when enabled */}
                {aiSummary && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4 border-l-4 border-indigo-400 dark:border-indigo-600">
                        <h4 className="font-medium text-indigo-700 dark:text-indigo-300 text-sm mb-1 flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            AI Summary
                        </h4>
                        <div
                            className="text-sm text-gray-700 dark:text-gray-300"
                            dangerouslySetInnerHTML={{
                                __html: formatAiSummary(aiSummary),
                            }}
                        />
                    </div>
                )}

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {project.shortDescription}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {project.programs.map((programId) => (
                        <span
                            key={programId}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                programColors[programId] ||
                                "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                            {getProgramName(programId)}
                        </span>
                    ))}
                </div>

                {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div
                            className="text-gray-700 dark:text-gray-300"
                            dangerouslySetInnerHTML={{
                                __html:
                                    project.fullDescription ||
                                    "No detailed description available.",
                            }}
                        />
                    </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Student Count  */}
                            {project.type === "duo" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                    <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                                    </svg>
                                    2 students
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                    <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    1 student
                                </span>
                            )}
                            {/* Supervisor */}
                            <span className="text-gray-600 dark:text-gray-400">
                                {project.teacher}
                            </span>
                            {/* Status */}
                            <span className="text-gray-600 dark:text-gray-400">
                                {project.status}
                            </span>
                            <span>
                                <a
                                    href={
                                        "https://www.idi.ntnu.no/education/" +
                                        project.link
                                    }
                                >
                                    🔗
                                </a>
                            </span>
                        </div>

                        {/* Action buttons - will appear below on mobile, to the right on desktop */}
                        <div className="flex w-full gap-2 mt-3 sm:mt-0 sm:w-auto sm:ml-auto">
                            {onHideToggle && (
                                <button
                                    onClick={onHideToggle}
                                    title={
                                        isHidden
                                            ? "Unhide project"
                                            : "Hide project"
                                    }
                                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                                        isHidden
                                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50"
                                    }`}
                                >
                                    {isHidden ? "Unhide" : "Hide"}
                                </button>
                            )}
                            {onFavoriteToggle && (
                                <button
                                    onClick={onFavoriteToggle}
                                    title={
                                        isFavorite
                                            ? "Remove from favorites"
                                            : "Add to favorites"
                                    }
                                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                                        isFavorite
                                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-800/50"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {isFavorite ? "Unfavorite" : "Favorite"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
