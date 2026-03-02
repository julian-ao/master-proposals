import { track } from "@vercel/analytics";
import { STUDY_PROGRAMS } from "../lib/constants";

interface StudyProgramFilterProps {
  programs: typeof STUDY_PROGRAMS;
  selectedPrograms: Record<string, boolean>;
  onToggleProgram: (programId: string) => void;
  filterMode: "union" | "intersection";
  onFilterModeChange: (mode: "union" | "intersection") => void;
  majorCourseFilter: "all" | "computerScience" | "informatics" | "exclusive";
  onMajorCourseFilterChange: (
    filter: "all" | "computerScience" | "informatics" | "exclusive",
  ) => void;
}

export function StudyProgramFilter({
  programs,
  selectedPrograms,
  onToggleProgram,
  filterMode,
  onFilterModeChange,
  /* majorCourseFilter,
  onMajorCourseFilterChange, */
}: StudyProgramFilterProps) {
  const handleToggleProgram = (programId: string) => {
    const programName =
      programs.find((p) => p.id === programId)?.name || programId;
    const action = selectedPrograms[programId] ? "deselected" : "selected";

    track("Specialization Filter", {
      program: programName,
      action: action,
    });

    onToggleProgram(programId);
  };

  const handleFilterModeChange = (mode: "union" | "intersection") => {
    track("Filter Mode Changed", { mode });
    onFilterModeChange(mode);
  };

  /* const handleMajorCourseFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value as
      | "all"
      | "computerScience"
      | "informatics"
      | "exclusive";
    track("Major Course Filter Changed", { value });
    onMajorCourseFilterChange(value);
  }; */

  // Group programs by majorCourse
  const groupedPrograms = programs.reduce(
    (acc, program) => {
      if (!acc[program.majorCourse]) {
        acc[program.majorCourse] = [];
      }
      acc[program.majorCourse].push(program);
      return acc;
    },
    {} as Record<string, typeof STUDY_PROGRAMS>,
  );

  // Format majorCourse names for display
  const formatMajorCourseName = (majorCourse: string): string => {
    switch (majorCourse) {
      case "informatics":
        return "Informatics (Informatikk)";
      case "computerScience":
        return "Computer Science (Datateknologi)";
      default:
        return majorCourse.charAt(0).toUpperCase() + majorCourse.slice(1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        Specializations
      </h2>
      <div className="space-y-5">
        {Object.entries(groupedPrograms).map(([majorCourse, majorPrograms]) => (
          <div key={majorCourse} className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              {formatMajorCourseName(majorCourse)}
            </h3>
            {majorPrograms.map((program) => (
              <label key={program.id} htmlFor={program.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  id={program.id}
                  type="checkbox"
                  checked={selectedPrograms[program.id]}
                  onChange={() => handleToggleProgram(program.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/25"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  {program.name}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* Major Course Filter */}
      {/* <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          Major Course Filter:
        </p>
        <select
          value={majorCourseFilter}
          onChange={handleMajorCourseFilterChange}
          className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
        >
          <option value="all">Show all projects</option>
          <option value="computerScience">Only Computer Science</option>
          <option value="informatics">Only Informatics</option>
          <option value="exclusive">Non-overlapping projects</option>
        </select>
      </div> */}

      {/* Filter mode control */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Specialization-filter mode
        </p>
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          <button
            type="button"
            onClick={() => handleFilterModeChange("intersection")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filterMode === "intersection"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Intersection
          </button>
          <button
            type="button"
            onClick={() => handleFilterModeChange("union")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filterMode === "union"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Union
          </button>
        </div>
      </div>
    </div>
  );
}
