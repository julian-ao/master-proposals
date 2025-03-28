
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
            <label htmlFor="darkModeToggle">Dark Mode</label>
            <input
                type="checkbox"
                id="darkModeToggle"
                checked={darkMode}
                onChange={toggleDarkMode}
            />
        </div>
    );
};
