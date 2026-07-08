import type { ArticleMeta, Language } from "@/lib/config";
import { getTranslations } from "@/lib/i18n";
import ArticleCard from "./ArticleCard";

interface ArticleGridProps {
  articles: ArticleMeta[];
  language: Language;
}

/**
 * Responsive grid layout for displaying ArticleCards.
 * Shows 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export default function ArticleGrid({ articles, language }: ArticleGridProps) {
  const t = getTranslations(language);

  if (articles.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500 dark:text-gray-400">
        {t.ui.noArticles}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} language={language} />
      ))}
    </div>
  );
}
