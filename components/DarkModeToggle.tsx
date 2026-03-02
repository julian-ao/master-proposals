"use client";

import useMounted from "@/hooks/use-mounted";
import { useTheme } from "next-themes";

export const DarkModeToggle: React.FC = () => {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();

  return (
    <label htmlFor="darkModeToggle" className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        id="darkModeToggle"
        checked={mounted ? theme === "dark" : false}
        onChange={(e) => {
          setTheme(e.target.checked ? "dark" : "light");
        }}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/25"
      />
      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
        Dark mode
      </span>
    </label>
  );
};
