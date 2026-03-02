import { IProject } from "@/lib/constants";

interface ProjectComparisonCardProps {
  project: IProject;
  showFullDescriptions: boolean;
  showAiSummaries: boolean;
  summaries: Record<string, { title: string; summary: string }>;
  eloRating: number;
  onUnfavorite?: () => void;
  getProgramName: (programId: string) => string;
  improvedTitle?: string;
  showImprovedTitle?: boolean;
}

export function ProjectComparisonCard({
  project,
  showFullDescriptions,
  showAiSummaries,
  summaries,
  eloRating,
  onUnfavorite,
  getProgramName,
  improvedTitle,
  showImprovedTitle = false,
}: ProjectComparisonCardProps) {
  const programColors: Record<string, string> = {
    p2_6: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    p2_7: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    p2_9: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    p2_10:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex flex-col h-full">
      {showImprovedTitle && improvedTitle ? (
        <>
          <h3 className="text-lg font-semibold mb-0.5 text-teal-600 dark:text-teal-400">
            {improvedTitle}
          </h3>
          <h4 className="text-sm text-gray-400 dark:text-gray-500 mb-3">
            {project.title}
          </h4>
        </>
      ) : (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{project.title}</h3>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {project.teacherLink ? (
          <a
            href={project.teacherLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {project.teacher}
          </a>
        ) : (
          project.teacher
        )}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.programs.map((programId) => (
          <span
            key={programId}
            className={`px-2.5 py-1 text-xs font-medium rounded-md ${
              programColors[programId] ||
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {getProgramName(programId)}
          </span>
        ))}
      </div>

      {showAiSummaries && summaries[project.id] && (
        <div className="mb-4 bg-teal-50 dark:bg-teal-950/40 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-1.5 flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            AI Summary
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {summaries[project.id].summary}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed flex-grow-0">{project.shortDescription}</p>

      {showFullDescriptions && (
        <div className="mb-4 flex-grow overflow-auto border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            Full Description
          </p>
          <div
            className="text-sm prose prose-sm dark:prose-invert max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: project.fullDescription,
            }}
          />
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          ELO: {eloRating || 1000}
        </p>
        {onUnfavorite && (
          <button
            onClick={onUnfavorite}
            className="px-3 py-1.5 rounded-lg flex items-center justify-center text-xs font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
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
