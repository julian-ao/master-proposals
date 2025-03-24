import { STUDY_PROGRAMS } from "../lib/constants"

interface StudyProgramFilterProps {
  programs: typeof STUDY_PROGRAMS
  selectedPrograms: Record<string, boolean>
  onToggleProgram: (programId: string) => void
}

export function StudyProgramFilter({ programs, selectedPrograms, onToggleProgram }: StudyProgramFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Specializations
      </h2>
      <div className="space-y-3">
        {programs.map(program => (
          <div key={program.id} className="flex items-center">
            <input
              id={program.id}
              type="checkbox"
              checked={selectedPrograms[program.id]}
              onChange={() => onToggleProgram(program.id)}
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
    </div>
  )
}