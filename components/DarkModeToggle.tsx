
"use client";
import { useState } from "react";

export const DarkModeToggle: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        const htmlElement = document.documentElement;
        if (darkMode) {
            htmlElement.classList.remove("dark");
        } else {
            htmlElement.classList.add("dark");
        }
        setDarkMode(!darkMode);
    };

    return (
        <div>
            
            <input
                type="checkbox"
                id="darkModeToggle"
                checked={darkMode}
                onChange={toggleDarkMode}
                 className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-3 text-sm text-gray-700 dark:text-gray-300" htmlFor="darkModeToggle">Dark Mode {darkMode ? "🌙" : "☀️"}</label>
        </div>
    );
};
