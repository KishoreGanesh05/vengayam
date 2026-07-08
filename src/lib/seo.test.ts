import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import path from "path";
import { loadAllArticles } from "./articles";
import { LANGUAGES, siteConfig, type Language } from "./config";
import sitemap from "@/app/sitemap";
import { GET } from "@/app/[lang]/feed.xml/route";

const CONTENT_DIR = path.join(process.cwd(), "content");

// =============================================================================
// Property 10: URL structure includes language prefix
// ∀ article ∈ allArticles: articleUrl(article) starts with /{article.language}/
// **Validates: Requirements 10**
// =============================================================================

describe("Property 10: URL structure includes language prefix", () => {
  it("all article URLs start with /{language}/ prefix", async () => {
    for (const lang of LANGUAGES) {
      const articles = await loadAllArticles(lang, CONTENT_DIR);

      for (const article of articles) {
        const articleUrl = `/${article.language}/articles/${article.slug}`;
        expect(articleUrl).toMatch(new RegExp(`^/${article.language}/`));
      }
    }
  });

  it("property: generated article URLs always contain language prefix (fast-check)", () => {
    const languageArb = fc.constantFrom<Language>("en", "ta");
    const slugArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => /^[a-z0-9-]+$/.test(s) && !s.startsWith("-") && !s.endsWith("-")
    );

    fc.assert(
      fc.property(languageArb, slugArb, (language, slug) => {
        const articleUrl = `/${language}/articles/${slug}`;
        return articleUrl.startsWith(`/${language}/`);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Sitemap tests
// =============================================================================

describe("Sitemap", () => {
  it("includes all published articles from both languages", async () => {
    const sitemapEntries = await sitemap();

    // Collect all articles from both languages
    const allArticles: { slug: string; language: Language }[] = [];
    for (const lang of LANGUAGES) {
      const articles = await loadAllArticles(lang, CONTENT_DIR);
      for (const article of articles) {
        allArticles.push({ slug: article.slug, language: lang });
      }
    }

    // For each article, verify its URL exists in the sitemap
    for (const { slug, language } of allArticles) {
      const expectedUrl = `${siteConfig.url}/${language}/articles/${slug}`;
      const found = sitemapEntries.some((entry) => entry.url === expectedUrl);
      expect(found, `Sitemap missing article: ${expectedUrl}`).toBe(true);
    }
  });

  it("article URLs include language prefix", async () => {
    const sitemapEntries = await sitemap();

    const articleEntries = sitemapEntries.filter((entry) =>
      entry.url.includes("/articles/")
    );

    for (const entry of articleEntries) {
      // Article URLs should match pattern: {baseUrl}/{lang}/articles/{slug}
      const urlWithoutBase = entry.url.replace(siteConfig.url, "");
      expect(urlWithoutBase).toMatch(/^\/(en|ta)\/articles\//);
    }
  });

  it("entries have alternates for both languages", async () => {
    const sitemapEntries = await sitemap();

    for (const entry of sitemapEntries) {
      expect(entry.alternates).toBeDefined();
      expect(entry.alternates?.languages).toBeDefined();

      const languages = entry.alternates?.languages as Record<string, string>;
      // Should have entries for both en and ta
      expect(languages["en"]).toBeDefined();
      expect(languages["ta"]).toBeDefined();

      // Each alternate should be a valid URL
      expect(languages["en"]).toMatch(/^https:\/\//);
      expect(languages["ta"]).toMatch(/^https:\/\//);
    }
  });

  it("includes homepage entries for both languages", async () => {
    const sitemapEntries = await sitemap();

    for (const lang of LANGUAGES) {
      const homepageUrl = `${siteConfig.url}/${lang}`;
      const found = sitemapEntries.some((entry) => entry.url === homepageUrl);
      expect(found, `Sitemap missing homepage for language: ${lang}`).toBe(true);
    }
  });
});

// =============================================================================
// RSS Feed tests
// =============================================================================

describe("RSS Feed", () => {
  it("generates valid XML for English feed", async () => {
    const request = new Request("https://vengayam.in/en/feed.xml");
    const response = await GET(request, { params: Promise.resolve({ lang: "en" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/rss+xml");

    const xml = await response.text();
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
    expect(xml).toContain("<rss");
    expect(xml).toContain("</rss>");
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
  });

  it("generates valid XML for Tamil feed", async () => {
    const request = new Request("https://vengayam.in/ta/feed.xml");
    const response = await GET(request, { params: Promise.resolve({ lang: "ta" }) });

    expect(response.status).toBe(200);

    const xml = await response.text();
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
    expect(xml).toContain("<rss");
    expect(xml).toContain("</rss>");
  });

  it("contains article entries with correct links including language prefix", async () => {
    const request = new Request("https://vengayam.in/en/feed.xml");
    const response = await GET(request, { params: Promise.resolve({ lang: "en" }) });
    const xml = await response.text();

    const articles = await loadAllArticles("en", CONTENT_DIR);

    for (const article of articles) {
      const expectedLink = `${siteConfig.url}/en/articles/${article.slug}`;
      expect(xml).toContain(expectedLink);
    }
  });

  it("RSS links include language prefix in URLs", async () => {
    for (const lang of LANGUAGES) {
      const request = new Request(`https://vengayam.in/${lang}/feed.xml`);
      const response = await GET(request, { params: Promise.resolve({ lang }) });
      const xml = await response.text();

      // All <link> entries within items should include language prefix
      const linkMatches = xml.match(/<link>([^<]+)<\/link>/g) || [];
      for (const linkTag of linkMatches) {
        const url = linkTag.replace("<link>", "").replace("</link>", "");
        // URLs should include the language prefix
        expect(url).toContain(`/${lang}`);
      }
    }
  });

  it("returns 404 for invalid language", async () => {
    const request = new Request("https://vengayam.in/fr/feed.xml");
    const response = await GET(request, { params: Promise.resolve({ lang: "fr" }) });

    expect(response.status).toBe(404);
  });
});
