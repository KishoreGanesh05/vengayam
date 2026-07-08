import { notFound } from "next/navigation";
import type { Category, Language } from "@/lib/config";
import {
  isValidCategory,
  isValidLanguage,
  CATEGORIES,
  LANGUAGES,
  getCategoryLabel,
} from "@/lib/config";
import { getArticlesByCategory } from "@/lib/articles";
import { getTranslations } from "@/lib/i18n";
import ArticleGrid from "@/components/ArticleGrid";

/**
 * Generate static params for all category × language combinations.
 * This pre-renders pages like /en/category/politics, /ta/category/tech, etc.
 */
export function generateStaticParams() {
  const params: { lang: string; category: string }[] = [];

  for (const lang of LANGUAGES) {
    for (const category of CATEGORIES) {
      params.push({ lang, category });
    }
  }

  return params;
}

/**
 * Category listing page — shows all articles for a given category
 * in a specific language.
 *
 * URL: /en/category/politics or /ta/category/local
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}) {
  const { lang, category } = await params;

  if (!isValidLanguage(lang) || !isValidCategory(category)) {
    notFound();
  }

  const language = lang as Language;
  const categorySlug = category as Category;
  const t = getTranslations(language);

  const articles = await getArticlesByCategory(categorySlug, language);
  const categoryLabel = getCategoryLabel(categorySlug, language);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Category heading */}
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          {categoryLabel}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t.ui.allArticles}
        </p>
      </header>

      {/* Articles grid */}
      <ArticleGrid articles={articles} language={language} />
    </div>
  );
}
