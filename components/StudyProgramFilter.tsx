import { track } from "@vercel/analytics";
import { STUDY_PROGRAMS } from "../lib/constants";

interface StudyProgramFilterProps {
    programs: typeof STUDY_PROGRAMS;
    selectedPrograms: Record<string, boolean>;
    onToggleProgram: (programId: string) => void;
    filterMode: "union" | "intersection";
    onFilterModeChange: (mode: "union" | "intersection") => void;
}

export function StudyProgramFilter({
    programs,
    selectedPrograms,
    onToggleProgram,
    filterMode,
    onFilterModeChange,
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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Specializations
            </h2>
            <div className="space-y-3">
                {programs.map((program) => (
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
