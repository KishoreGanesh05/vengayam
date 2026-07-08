import type { Language } from "@/lib/config";
import { isValidLanguage } from "@/lib/config";
import { loadAllArticles, getFeaturedArticles } from "@/lib/articles";
import { getTranslations } from "@/lib/i18n";
import FeaturedArticle from "@/components/FeaturedArticle";
import ArticleGrid from "@/components/ArticleGrid";
import { notFound } from "next/navigation";

/**
 * Language homepage — shows featured articles as a hero section
 * and recent articles in a grid below.
 *
 * URL: /en/ or /ta/
 */
export default async function LangHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const language = lang as Language;
  const t = getTranslations(language);

  const [featuredArticles, allArticles] = await Promise.all([
    getFeaturedArticles(language),
    loadAllArticles(language),
  ]);

  // Recent articles exclude featured ones to avoid duplication
  const featuredSlugs = new Set(featuredArticles.map((a) => a.slug));
  const recentArticles = allArticles.filter((a) => !featuredSlugs.has(a.slug));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Featured articles hero section */}
      {featuredArticles.length > 0 && (
        <section className="mb-12">
          <FeaturedArticle
            article={featuredArticles[0]}
            language={language}
          />
        </section>
      )}

      {/* Recent articles grid */}
      <section>
        <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t.ui.latestNews}
        </h2>
        <ArticleGrid articles={recentArticles} language={language} />
      </section>
    </div>
  );
}
