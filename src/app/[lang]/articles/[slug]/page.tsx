import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import {
  getArticleBySlug,
  getRelatedArticles,
  loadAllArticles,
} from "@/lib/articles";
import { LANGUAGES, type Language, isValidLanguage, siteConfig } from "@/lib/config";
import { mdxComponents } from "@/components/mdx";
import CategoryBadge from "@/components/CategoryBadge";
import ArticleGrid from "@/components/ArticleGrid";
import { getTranslations } from "@/lib/i18n";
import ShareButtons from "@/components/ShareButtons";

/**
 * Generate static params for all article pages across both languages.
 * Each article MDX file produces a { lang, slug } pair.
 */
export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];

  for (const lang of LANGUAGES) {
    const articles = await loadAllArticles(lang);
    for (const article of articles) {
      params.push({ lang, slug: article.slug });
    }
  }

  return params;
}

/**
 * Generate dynamic metadata for article pages including Open Graph tags
 * and hreflang alternate links between English and Tamil versions.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;

  if (!isValidLanguage(lang)) {
    return {};
  }

  const article = await getArticleBySlug(slug, lang as Language);

  if (!article) {
    return {};
  }

  const articleUrl = `${siteConfig.url}/${lang}/articles/${slug}`;
  const imageUrl = `${siteConfig.url}${article.coverImage}`;

  // Build hreflang alternates for both languages
  const languages: Record<string, string> = {};
  for (const l of LANGUAGES) {
    languages[l] = `${siteConfig.url}/${l}/articles/${slug}`;
  }

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          alt: article.title,
        },
      ],
      type: "article",
      publishedTime: article.publishedAt,
      locale: lang === "ta" ? "ta_IN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [imageUrl],
    },
    alternates: {
      canonical: articleUrl,
      languages,
    },
  };
}

/**
 * Article detail page.
 *
 * Renders the full article with metadata (title, subtitle, author, date, category),
 * the MDX body with custom components, and a related articles section at the bottom.
 */
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const language = lang as Language;
  const article = await getArticleBySlug(slug, language);

  if (!article) {
    notFound();
  }

  const t = getTranslations(language);
  const formattedDate = format(new Date(article.publishedAt), "MMMM d, yyyy");
  const relatedArticles = await getRelatedArticles(
    slug,
    article.category,
    language,
    3
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {/* Article header */}
      <header className="mb-8">
        {/* Category badge */}
        <div className="mb-4">
          <CategoryBadge category={article.category} language={language} />
        </div>

        {/* Title */}
        <h1 className="font-heading mb-3 text-3xl font-bold leading-tight text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="mb-4 text-xl text-gray-600 dark:text-gray-300">
            {article.subtitle}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <time dateTime={article.publishedAt}>{formattedDate}</time>
        </div>
      </header>

      {/* Cover image */}
      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 768px"
          priority
        />
      </div>

      {/* MDX article body */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MDXRemote source={article.content} components={mdxComponents} />
      </div>

      {/* Share buttons */}
      <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
        <ShareButtons
          url={`${siteConfig.url}/${language}/articles/${slug}`}
          title={article.title}
          language={language}
        />
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-8 dark:border-gray-800">
          <h2 className="font-heading mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            {t.ui.relatedArticles}
          </h2>
          <ArticleGrid articles={relatedArticles} language={language} />
        </section>
      )}
    </article>
  );
}
