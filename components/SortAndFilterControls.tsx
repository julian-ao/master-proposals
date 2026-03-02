import { track } from "@vercel/analytics";

interface SortAndFilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projectCount: number;
  sortByProjectId: "alpha" | "asc" | "desc";
  onSortByProjectIdChange: (sort: "alpha" | "asc" | "desc") => void;
}

export function SortAndFilterControls({
  searchQuery,
  onSearchChange,
  projectCount,
  sortByProjectId,
  onSortByProjectIdChange,
}: SortAndFilterControlsProps) {
  const handleSearch = (query: string) => {
    track("Search", { query });
    onSearchChange(query);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="block w-full pl-10 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="sort-project-id"
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Sort:
          </label>
          <select
            id="sort-project-id"
            value={sortByProjectId}
            onChange={(e) =>
              onSortByProjectIdChange(
                e.target.value as "alpha" | "asc" | "desc",
              )
            }
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-1.5 pl-2.5 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          >
            <option value="alpha">Alphabetically</option>
            <option value="asc">Old to new</option>
            <option value="desc">New to old</option>
          </select>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Showing {projectCount} project{projectCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
