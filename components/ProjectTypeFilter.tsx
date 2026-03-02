import { track } from "@vercel/analytics";

interface ProjectTypeFilterProps {
  value: "all" | "single" | "duo";
  onChange: (value: "all" | "single" | "duo") => void;
}

export function ProjectTypeFilter({ value, onChange }: ProjectTypeFilterProps) {
  const handleTypeChange = (newValue: "all" | "single" | "duo") => {
    track("Project Type Filter", {
      type: newValue,
      previous_type: value,
    });
    onChange(newValue);
  };

  const options: { key: "all" | "single" | "duo"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "single", label: "1 student" },
    { key: "duo", label: "2 students" },
  ];

  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Group Size
      </p>
      <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => handleTypeChange(option.key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              value === option.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
