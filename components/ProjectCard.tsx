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
    '<strong class="text-teal-600 dark:text-teal-400">$1</strong>',
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
  improvedTitle?: string;
  showImprovedTitle?: boolean;
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
  improvedTitle,
  showImprovedTitle = false,
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
    p2_10:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {showImprovedTitle && improvedTitle && (
              <h3 className="text-lg font-semibold text-teal-600 dark:text-teal-400 mb-0.5">
                {improvedTitle}
              </h3>
            )}
            <h3
              className={`font-semibold text-gray-900 dark:text-white mb-2 ${
                showImprovedTitle && improvedTitle
                  ? "text-sm font-normal text-gray-500 dark:text-gray-400"
                  : "text-lg"
              }`}
            >
              {project.title}
            </h3>
          </div>
          <button
            onClick={() => {
              track("My Event", {}, { flags: ["summer-sale"] });
              setExpanded(!expanded);
            }}
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
        </div>

        {/* AI Summary - displayed when enabled */}
        {aiSummary && (
          <div className="bg-teal-50 dark:bg-teal-950/40 rounded-lg p-4 mb-4 border border-teal-200 dark:border-teal-800">
            <h4 className="font-medium text-teal-700 dark:text-teal-400 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
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
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: formatAiSummary(aiSummary),
              }}
            />
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          {project.shortDescription}
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

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose-sm"
              dangerouslySetInnerHTML={{
                __html:
                  project.fullDescription ||
                  "No detailed description available.",
              }}
            />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {project.type === "duo" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-medium">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 text-xs font-medium">
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
              <span className="text-gray-500 dark:text-gray-400">
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
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">
                {project.status}
              </span>
              <a
                href={"https://www.idi.ntnu.no/education/" + project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                IDI
              </a>
            </div>
            <div className="flex w-full gap-2 mt-2 sm:mt-0 sm:w-auto sm:ml-auto">
              {onHideToggle && (
                <button
                  onClick={onHideToggle}
                  title={isHidden ? "Unhide project" : "Hide project"}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                    isHidden
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                  }`}
                >
                  {isHidden ? "Unhide" : "Hide"}
                </button>
              )}
              {onFavoriteToggle && (
                <button
                  onClick={onFavoriteToggle}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                    isFavorite
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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
