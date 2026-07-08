interface PullQuoteProps {
  quote: string;
  attribution?: string;
}

/**
 * PullQuote — editorial-style pull quote for MDX articles.
 * Renders a large, visually distinct quote with optional attribution.
 * Used in MDX like: <PullQuote quote="..." attribution="..." />
 */
export default function PullQuote({ quote, attribution }: PullQuoteProps) {
  return (
    <aside
      className="my-8 border-t-2 border-b-2 border-gray-900 py-6 px-4 dark:border-gray-100"
      role="figure"
      aria-label={attribution ? `Quote by ${attribution}` : "Pull quote"}
    >
      <blockquote className="text-center">
        <p className="font-heading text-2xl font-semibold italic leading-relaxed text-gray-900 dark:text-gray-100 md:text-3xl">
          &ldquo;{quote}&rdquo;
        </p>
        {attribution && (
          <footer className="mt-3 text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            &mdash; {attribution}
          </footer>
        )}
      </blockquote>
    </aside>
  );
}
