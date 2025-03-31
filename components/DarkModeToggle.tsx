"use client";

import useMounted from "@/hooks/use-mounted";
import { useTheme } from "next-themes";

export const DarkModeToggle: React.FC = () => {
    const mounted = useMounted();
    const { theme, setTheme } = useTheme();

    return (
        <div>
            <input
                type="checkbox"
                id="darkModeToggle"
                checked={mounted ? theme === "dark" : false}
                onChange={(e) => {
                    setTheme(e.target.checked ? "dark" : "light");
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
                className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                htmlFor="darkModeToggle"
            >
                Dark Mode {mounted ? (theme === "dark" ? "🌙" : "☀️") : ""}
            </label>
        </div>
    );
};
