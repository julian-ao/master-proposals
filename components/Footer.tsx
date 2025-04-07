export function Footer() {
  return (
    <footer className="mt-12 py-2 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 w-full bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This website does not guarantee data accuracy. Information sourced from{" "}
          <a
            href="https://www.idi.ntnu.no/education/fordypningsprosjekt.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
          >
            IDI
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
