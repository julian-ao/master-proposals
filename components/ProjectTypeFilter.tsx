interface ProjectTypeFilterProps {
  value: 'all' | 'single' | 'duo'
  onChange: (value: 'all' | 'single' | 'duo') => void
}

export function ProjectTypeFilter({ value, onChange }: ProjectTypeFilterProps) {
  return (
    <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Project Type</h3>
      <div className="flex items-center space-x-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            checked={value === 'all'}
            onChange={() => onChange('all')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All Projects</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            checked={value === 'single'}
            onChange={() => onChange('single')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Single</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            checked={value === 'duo'}
            onChange={() => onChange('duo')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Duo</span>
        </label>
      </div>
    </div>
  )
}