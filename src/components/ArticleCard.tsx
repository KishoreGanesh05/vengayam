import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { ArticleMeta, Language } from "@/lib/config";
import { getTranslations } from "@/lib/i18n";
import CategoryBadge from "./CategoryBadge";

interface ArticleCardProps {
  article: ArticleMeta;
  language: Language;
}

/**
 * Card component for article listings. Displays cover image, category badge,
 * title, excerpt, and publication date with a newspaper/editorial aesthetic.
 */
export default function ArticleCard({ article, language }: ArticleCardProps) {
  const t = getTranslations(language);
  const articleUrl = `/${language}/articles/${article.slug}`;
  const formattedDate = format(new Date(article.publishedAt), "MMM d, yyyy");

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
      {/* Cover image */}
      <Link href={articleUrl} className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category badge + date */}
        <div className="mb-2 flex items-center gap-2">
          <CategoryBadge category={article.category} language={language} />
          <time
            dateTime={article.publishedAt}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {formattedDate}
          </time>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-heading text-lg font-bold leading-tight text-gray-900 dark:text-white">
          <Link href={articleUrl} className="hover:underline">
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {article.excerpt}
        </p>

        {/* Read more link */}
        <Link
          href={articleUrl}
          className="self-start text-sm font-medium text-gray-900 hover:underline dark:text-white"
        >
          {t.ui.readMore} →
        </Link>
      </div>
    </article>
  );
}
