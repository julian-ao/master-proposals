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
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        AI Summary:
                    </p>
                    <p className="text-sm italic text-gray-600 dark:text-gray-300">
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
