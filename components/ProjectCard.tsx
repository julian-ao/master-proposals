import { useState } from "react"
import { Project } from "../app/page"

interface ProjectCardProps {
  project: Project
  getProgramName: (programId: string) => string
}

export function ProjectCard({ project, getProgramName }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)

  const programColors: Record<string, string> = {
    p2_6: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    p2_7: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    p2_9: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    p2_10: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {project.title}
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">{project.shortDescription}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.programs.map(programId => (
            <span
              key={programId}
              className={`px-2 py-1 text-xs font-medium rounded-full ${programColors[programId] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              {getProgramName(programId)}
            </span>
          ))}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {project.fullDescription || "No detailed description available."}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Supervisor:</span> {project.teacher}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Status:</span> {project.status}
          </div>
        </div>
      </div>
    </div>
  )
}