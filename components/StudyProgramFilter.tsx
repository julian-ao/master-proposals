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
  majorCourseFilter,
  onMajorCourseFilterChange,
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

  const handleMajorCourseFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value as
      | "all"
      | "computerScience"
      | "informatics"
      | "exclusive";
    track("Major Course Filter Changed", { value });
    onMajorCourseFilterChange(value);
  };

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
        return "Informatics";
      case "computerScience":
        return "Computer Science";
      default:
        return majorCourse.charAt(0).toUpperCase() + majorCourse.slice(1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Specializations
      </h2>
      <div className="space-y-6">
        {Object.entries(groupedPrograms).map(([majorCourse, majorPrograms]) => (
          <div key={majorCourse} className="space-y-3">
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
              {formatMajorCourseName(majorCourse)}
            </h3>
            {majorPrograms.map((program) => (
              <div key={program.id} className="flex items-center">
                <input
                  id={program.id}
                  type="checkbox"
                  checked={selectedPrograms[program.id]}
                  onChange={() => handleToggleProgram(program.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={program.id}
                  className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  {program.name}
                </label>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Major Course Filter */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
      </div>

      {/* Filter mode control */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          Specialization-filter:
        </p>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleFilterModeChange("intersection")}
            className={`px-3 py-1 text-sm rounded-md ${
              filterMode === "intersection"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Intersection
          </button>
          <button
            type="button"
            onClick={() => handleFilterModeChange("union")}
            className={`px-3 py-1 text-sm rounded-md ${
              filterMode === "union"
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Union
          </button>
        </div>
      </div>
    </div>
  );
}
