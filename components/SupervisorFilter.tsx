import { useState } from "react";
import { track } from "@vercel/analytics";

interface SupervisorFilterProps {
  supervisors: string[];
  selected: Record<string, boolean>;
  excluded: Record<string, boolean>;
  onToggle: (supervisor: string) => void;
  onExclude: (supervisor: string) => void;
  onClear: () => void;
  loading: boolean;
}

export function SupervisorFilter({
  supervisors,
  selected,
  excluded,
  onToggle,
  onExclude,
  onClear,
  loading,
}: SupervisorFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"include" | "exclude">("include");

  const filteredSupervisors = supervisors.filter((supervisor) =>
    supervisor.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const hasSelections =
    Object.keys(selected).length > 0 || Object.keys(excluded).length > 0;

  const handleToggle = (supervisor: string) => {
    track("Supervisor Filter", {
      action: "include",
      supervisor,
      state: !selected[supervisor] ? "added" : "removed",
    });
    onToggle(supervisor);
  };

  const handleExclude = (supervisor: string) => {
    track("Supervisor Filter", {
      action: "exclude",
      supervisor,
      state: !excluded[supervisor] ? "added" : "removed",
    });
    onExclude(supervisor);
  };

  const handleClear = () => {
    track("Supervisor Filter", {
      action: "clear_all",
      previously_included: Object.keys(selected).length,
      previously_excluded: Object.keys(excluded).length,
    });
    onClear();
  };

  const handleViewModeChange = (mode: "include" | "exclude") => {
    track("Supervisor Filter UI", {
      action: "view_mode_change",
      mode,
    });
    setViewMode(mode);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Supervisors
        </h3>
        {hasSelections && (
          <button
            onClick={handleClear}
            className="text-xs font-medium text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 mb-3">
        <button
          onClick={() => handleViewModeChange("include")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            viewMode === "include"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Include
        </button>
        <button
          onClick={() => handleViewModeChange("exclude")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            viewMode === "exclude"
              ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Exclude
        </button>
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search supervisors..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          value={searchTerm}
          onChange={(e) => {
            if (e.target.value.length > 0) {
              track("Supervisor Filter UI", {
                action: "search",
                query: e.target.value,
              });
            }
            setSearchTerm(e.target.value);
          }}
        />
        <svg
          className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {filteredSupervisors.length > 0 ? (
          filteredSupervisors.map((supervisor) => (
            <div key={supervisor} className="flex items-center justify-between py-0.5">
              <label htmlFor={`supervisor-${supervisor}`} className="flex items-center gap-2 cursor-pointer group min-w-0">
                <input
                  id={`supervisor-${supervisor}`}
                  name={supervisor}
                  type="checkbox"
                  checked={!!selected[supervisor]}
                  onChange={() =>
                    viewMode === "include"
                      ? handleToggle(supervisor)
                      : handleExclude(supervisor)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/25 flex-shrink-0"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 truncate transition-colors">
                  {supervisor}
                </span>
              </label>
              {(selected[supervisor] || excluded[supervisor]) && (
                <span className={`text-xs font-medium flex-shrink-0 ml-2 ${
                  selected[supervisor]
                    ? "text-indigo-500"
                    : "text-red-500"
                }`}>
                  {selected[supervisor] ? "Included" : "Excluded"}
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
            {loading ? "Loading..." : "No supervisors found"}
          </p>
        )}
      </div>
    </div>
  );
}
