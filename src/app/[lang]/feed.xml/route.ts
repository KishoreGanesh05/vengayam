import { loadAllArticles } from "@/lib/articles";
import { siteConfig, type Language, isValidLanguage } from "@/lib/config";

/**
 * Generates a valid RSS 2.0 XML feed for the specified language.
 * Available at /en/feed.xml and /ta/feed.xml
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    return new Response("Not Found", { status: 404 });
  }

  const language = lang as Language;
  const articles = await loadAllArticles(language);

  const langLabel = language === "ta" ? "Tamil" : "English";
  const feedTitle = `${siteConfig.name} - ${langLabel}`;
  const feedDescription =
    language === "ta" ? siteConfig.descriptionTamil : siteConfig.description;
  const feedLink = `${siteConfig.url}/${language}`;

  const items = articles
    .map((article) => {
      const articleUrl = `${siteConfig.url}/${language}/articles/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toUTCString();

      return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${article.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${article.category}</category>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${feedLink}</link>
    <description>${feedDescription}</description>
    <language>${language === "ta" ? "ta" : "en"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/${language}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
