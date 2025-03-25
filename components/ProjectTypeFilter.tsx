import { track } from '@vercel/analytics';

interface ProjectTypeFilterProps {
  value: 'all' | 'single' | 'duo'
  onChange: (value: 'all' | 'single' | 'duo') => void
}

export function ProjectTypeFilter({ value, onChange }: ProjectTypeFilterProps) {
  const handleTypeChange = (newValue: 'all' | 'single' | 'duo') => {
    track('Project Type Filter', {
      type: newValue,
      previous_type: value
    });
    onChange(newValue);
  };

  return (
    <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Project Type</h3>
      <div className="flex items-center space-x-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            checked={value === 'all'}
            onChange={() => handleTypeChange('all')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            checked={value === 'single'}
            onChange={() => handleTypeChange('single')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">1 student</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            checked={value === 'duo'}
            onChange={() => handleTypeChange('duo')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">2 students</span>
        </label>
      </div>
    </div>
  )
}