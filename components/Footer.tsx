export function Footer() {
  return (
    <footer className="sticky bottom-0 z-10 py-3 border-t border-gray-200 dark:border-gray-800 w-full bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Data accuracy not guaranteed. Sourced from{" "}
          <a
            href="https://www.idi.ntnu.no/education/fordypningsprosjekt.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors"
          >
            IDI
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
