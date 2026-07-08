import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { ArticleMeta, Language } from "@/lib/config";
import { getTranslations } from "@/lib/i18n";
import CategoryBadge from "./CategoryBadge";

interface FeaturedArticleProps {
  article: ArticleMeta;
  language: Language;
}

/**
 * Hero-style display for featured articles. Shows a large cover image
 * with overlaid text in a newspaper editorial style.
 */
export default function FeaturedArticle({
  article,
  language,
}: FeaturedArticleProps) {
  const t = getTranslations(language);
  const articleUrl = `/${language}/articles/${article.slug}`;
  const formattedDate = format(new Date(article.publishedAt), "MMMM d, yyyy");

  return (
    <article className="group relative overflow-hidden rounded-xl">
      {/* Background image */}
      <Link href={articleUrl} className="block">
        <div className="relative aspect-[16/9] sm:aspect-[21/9]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      </Link>

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
        {/* Featured label + category */}
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded bg-white/90 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-900">
            {t.ui.featured}
          </span>
          <CategoryBadge
            category={article.category}
            language={language}
            linked={false}
          />
        </div>

        {/* Title */}
        <h2 className="mb-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          <Link href={articleUrl} className="hover:underline">
            {article.title}
          </Link>
        </h2>

        {/* Subtitle / Excerpt */}
        {article.subtitle ? (
          <p className="mb-3 text-base text-gray-200 sm:text-lg">
            {article.subtitle}
          </p>
        ) : (
          <p className="mb-3 line-clamp-2 text-base text-gray-200 sm:text-lg">
            {article.excerpt}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <time dateTime={article.publishedAt}>{formattedDate}</time>
        </div>
      </div>
    </article>
  );
}
