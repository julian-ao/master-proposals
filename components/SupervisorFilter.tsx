"use client"
import { useState } from "react"

interface SupervisorFilterProps {
  supervisors: string[]
  selected: Record<string, boolean>
  onToggle: (supervisor: string) => void
  onClear: () => void
}

export function SupervisorFilter({
  supervisors,
  selected,
  onToggle,
  onClear
}: SupervisorFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSupervisors = supervisors.filter(supervisor =>
    supervisor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasSelections = Object.keys(selected).length > 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Supervisors</h3>
        {hasSelections && (
          <button
            onClick={onClear}
            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search supervisors..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <svg
          className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="space-y-2 overflow-y-auto">
        {filteredSupervisors.length > 0 ? (
          filteredSupervisors.map((supervisor) => (
            <div key={supervisor} className="flex items-center">
              <input
                id={`supervisor-${supervisor}`}
                type="checkbox"
                checked={!!selected[supervisor]}
                onChange={() => onToggle(supervisor)}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label
                htmlFor={`supervisor-${supervisor}`}
                className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate"
                title={supervisor}
              >
                {supervisor}
              </label>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
            No supervisors found
          </p>
        )}
      </div>
    </div>
  )
}