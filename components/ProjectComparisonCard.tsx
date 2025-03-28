import { IProject } from "@/lib/constants";

interface ProjectComparisonCardProps {
    project: IProject;
    showFullDescriptions: boolean;
    showAiSummaries: boolean;
    summaries: Record<string, string>;
    eloRating: number;
    onUnfavorite?: () => void;
    getProgramName: (programId: string) => string;
}

export function ProjectComparisonCard({
    project,
    showFullDescriptions,
    showAiSummaries,
    summaries,
    eloRating,
    onUnfavorite,
    getProgramName,
}: ProjectComparisonCardProps) {
    const programColors: Record<string, string> = {
        p2_6: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        p2_7: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        p2_9: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        p2_10: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-3">{project.title}</h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Supervisor:{" "}
                {project.teacherLink ? (
                    <a
                        href={project.teacherLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                        {project.teacher}
                    </a>
                ) : (
                    project.teacher
                )}
            </p>

            {/* Program specializations */}
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

            {/* AI Summary - above short description */}
            {showAiSummaries && summaries[project.title] && (
                <div className="mb-5 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/40 dark:to-blue-800/20 p-4 rounded-md border-l-4 border-blue-500 dark:border-blue-400 shadow-sm">
                    <div className="flex items-center mb-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            AI Summary
                        </p>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 pl-1.5">
                        {summaries[project.title]}
                    </p>
                </div>
            )}

            {/* Short description */}
            <p className="text-sm mb-4 flex-grow-0">
                {project.shortDescription}
            </p>

            {/* Full description */}
            {showFullDescriptions && (
                <div className="mb-4 flex-grow overflow-auto border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                        Full Description:
                    </p>
                    <div
                        className="text-sm prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                            __html: project.fullDescription,
                        }}
                    />
                </div>
            )}

            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                    Current ELO: {eloRating || 1000}
                </p>

                {/* Unfavorite button */}
                {onUnfavorite && (
                    <button
                        onClick={onUnfavorite}
                        className="px-3 py-1.5 rounded-md flex items-center justify-center text-xs font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50"
                        title="Remove from favorites"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 mr-1"
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
                        Unfavorite
                    </button>
                )}
            </div>
        </div>
    );
}
