import { IProject } from "@/lib/constants";

interface ProjectComparisonCardProps {
    project: IProject;
    showFullDescriptions: boolean;
    showAiSummaries: boolean;
    summaries: Record<string, string>;
    eloRating: number;
}

export function ProjectComparisonCard({
    project,
    showFullDescriptions,
    showAiSummaries,
    summaries,
    eloRating,
}: ProjectComparisonCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-3">{project.title}</h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Supervisor: {project.teacher}
            </p>

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
                <div className="mb-4 flex-grow overflow-auto max-h-64 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
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

            <p className="text-xs text-gray-500 mt-auto pt-3">
                Current ELO: {eloRating || 1000}
            </p>
        </div>
    );
}
