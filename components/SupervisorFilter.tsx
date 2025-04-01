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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Supervisors
        </h3>
        {hasSelections && (
          <button
            onClick={handleClear}
            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex space-x-2 mb-3">
        <button
          onClick={() => handleViewModeChange("include")}
          className={`text-xs px-3 py-1 rounded-md ${
            viewMode === "include"
              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          Include
        </button>
        <button
          onClick={() => handleViewModeChange("exclude")}
          className={`text-xs px-3 py-1 rounded-md ${
            viewMode === "exclude"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          Exclude
        </button>
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search supervisors..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
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

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredSupervisors.length > 0 ? (
          filteredSupervisors.map((supervisor) => (
            <div key={supervisor} className="flex items-center justify-between">
              <div className="flex items-center">
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
                  className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <label
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate"
                  htmlFor={`supervisor-${supervisor}`}
                >
                  {supervisor}
                </label>
              </div>
              <span className="text-xs text-gray-500">
                {selected[supervisor] ? (
                  <span className="text-indigo-600">Included</span>
                ) : excluded[supervisor] ? (
                  <span className="text-red-600">Excluded</span>
                ) : null}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
            {loading ? "Loading..." : "No supervisors found"}
          </p>
        )}
      </div>
    </div>
  );
}
