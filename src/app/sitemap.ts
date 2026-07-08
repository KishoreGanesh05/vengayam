import type { MetadataRoute } from "next";
import { loadAllArticles } from "@/lib/articles";
import { LANGUAGES, CATEGORIES, siteConfig } from "@/lib/config";

/**
 * Generates a sitemap for the site including:
 * - Homepages for both languages
 * - All published article pages for both languages
 * - All category pages for both languages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Add homepages for both languages
  for (const lang of LANGUAGES) {
    const languages: Record<string, string> = {};
    for (const l of LANGUAGES) {
      languages[l] = `${siteConfig.url}/${l}`;
    }

    entries.push({
      url: `${siteConfig.url}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: { languages },
    });
  }

  // Add all article pages for both languages
  for (const lang of LANGUAGES) {
    const articles = await loadAllArticles(lang);

    for (const article of articles) {
      const languages: Record<string, string> = {};
      for (const l of LANGUAGES) {
        languages[l] = `${siteConfig.url}/${l}/articles/${article.slug}`;
      }

      entries.push({
        url: `${siteConfig.url}/${lang}/articles/${article.slug}`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages },
      });
    }
  }

  // Add category pages for both languages
  for (const lang of LANGUAGES) {
    for (const category of CATEGORIES) {
      const languages: Record<string, string> = {};
      for (const l of LANGUAGES) {
        languages[l] = `${siteConfig.url}/${l}/category/${category}`;
      }

      entries.push({
        url: `${siteConfig.url}/${lang}/category/${category}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
