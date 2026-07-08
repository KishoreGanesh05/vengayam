import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import os from "os";
import {
  getFeaturedArticles,
  getArticlesByCategory,
  getArticleBySlug,
} from "./articles";
import { CATEGORIES, LANGUAGES, type Category, type Language } from "./config";

// =============================================================================
// Arbitraries — reusing patterns from articles.property.test.ts
// =============================================================================

/** Generate a valid slug (URL-safe filename without extension) */
const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]*[a-z0-9]$/, {
  minLength: 3,
  maxLength: 30,
});

/** Generate a valid past date string (ISO 8601, guaranteed in the past) */
const pastDateArb = fc
  .integer({ min: 2020, max: 2024 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) => {
        const y = String(year);
        const m = String(month).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${y}-${m}-${d}`;
      })
    )
  );

/** Generate a valid category */
const categoryArb = fc.constantFrom(...CATEGORIES);

/** Generate a valid language */
const languageArb = fc.constantFrom(...LANGUAGES);

/**
 * Generate a non-empty string safe for YAML double-quoted values.
 */
function safeString(maxLen: number) {
  return fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]*$/, {
    minLength: 2,
    maxLength: maxLen,
  });
}

/** Escape characters that break YAML double-quoted strings */
function escapeYaml(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** An article definition used to generate MDX files */
interface ArticleDef {
  slug: string;
  title: string;
  publishedAt: string;
  category: Category;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string;
  featured: boolean;
}

/** Generate a valid article definition (past-dated) */
const articleDefArb = fc.record({
  slug: slugArb,
  title: safeString(100),
  publishedAt: pastDateArb,
  category: categoryArb,
  excerpt: safeString(200),
  coverImage: fc.constant("/images/articles/placeholder.jpg"),
  coverImageAlt: safeString(50),
  featured: fc.boolean(),
});

/** Generate a list of articles with unique slugs */
function uniqueArticlesArb(
  articleArb: fc.Arbitrary<ArticleDef>,
  minLength = 1,
  maxLength = 10
) {
  return fc
    .array(articleArb, { minLength, maxLength: maxLength * 2 })
    .map((articles) => {
      const seen = new Set<string>();
      return articles.filter((a) => {
        if (seen.has(a.slug)) return false;
        seen.add(a.slug);
        return true;
      });
    })
    .filter((articles) => articles.length >= minLength);
}

/**
 * Generate articles where at least one is featured.
 * This ensures the property test always has featured articles to verify.
 */
function articlesWithFeaturedArb(minLength = 2, maxLength = 10) {
  return uniqueArticlesArb(articleDefArb, minLength, maxLength).chain(
    (articles) => {
      // Ensure at least one article is featured
      if (!articles.some((a) => a.featured)) {
        // Pick a random index and force it to featured
        return fc.integer({ min: 0, max: articles.length - 1 }).map((idx) => {
          const result = [...articles];
          result[idx] = { ...result[idx], featured: true };
          return result;
        });
      }
      return fc.constant(articles);
    }
  );
}

/** Convert an article definition to MDX file content */
function articleToMdx(article: ArticleDef, language: Language): string {
  return [
    "---",
    `title: "${escapeYaml(article.title)}"`,
    `publishedAt: "${article.publishedAt}"`,
    `category: "${article.category}"`,
    `language: "${language}"`,
    `excerpt: "${escapeYaml(article.excerpt)}"`,
    `coverImage: "${article.coverImage}"`,
    `coverImageAlt: "${escapeYaml(article.coverImageAlt)}"`,
    `featured: ${article.featured}`,
    "---",
    "",
    "Article body content for testing.",
  ].join("\n");
}

// =============================================================================
// Test Helpers — Temp directory management
// =============================================================================

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "vengayam-pages-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

/** Write article MDX files to a temp content directory for a given language */
async function writeArticles(
  articles: ArticleDef[],
  language: Language
): Promise<string> {
  const langDir = path.join(tempDir, language);
  await mkdir(langDir, { recursive: true });

  for (const article of articles) {
    const content = articleToMdx(article, language);
    await writeFile(
      path.join(langDir, `${article.slug}.mdx`),
      content,
      "utf-8"
    );
  }

  return tempDir;
}

// =============================================================================
// Property Tests for Page Rendering Logic
// =============================================================================

describe("Page Rendering Property Tests", () => {
  /**
   * **Validates: Correctness Property 4**
   *
   * Property 4: Featured articles appear on language homepage
   * ∀ lang ∈ Languages: ∀ article ∈ articles(lang):
   *   article.featured === true ⟹ article ∈ homepageHero(lang)
   *
   * The homepage hero displays featured articles via getFeaturedArticles().
   * This property verifies that every article with featured === true
   * appears in the getFeaturedArticles() result for that language.
   */
  describe("Property 4: Featured articles appear on language homepage", () => {
    it("all featured articles are returned by getFeaturedArticles", async () => {
      await fc.assert(
        fc.asyncProperty(
          articlesWithFeaturedArb(2, 12),
          languageArb,
          async (articles, language) => {
            const contentDir = await writeArticles(articles, language);
            const featured = await getFeaturedArticles(language, contentDir);

            // Identify which articles from our input set are featured
            const expectedFeaturedSlugs = articles
              .filter((a) => a.featured)
              .map((a) => a.slug);

            const returnedSlugs = featured.map((a) => a.slug);

            // Every featured article from the input must appear in the result
            for (const slug of expectedFeaturedSlugs) {
              expect(returnedSlugs).toContain(slug);
            }

            // All returned articles must have featured === true
            for (const article of featured) {
              expect(article.featured).toBe(true);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it("non-featured articles do not appear in getFeaturedArticles", async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueArticlesArb(articleDefArb, 2, 10),
          languageArb,
          async (articles, language) => {
            const contentDir = await writeArticles(articles, language);
            const featured = await getFeaturedArticles(language, contentDir);

            const nonFeaturedSlugs = articles
              .filter((a) => !a.featured)
              .map((a) => a.slug);

            const returnedSlugs = featured.map((a) => a.slug);

            // No non-featured article should appear in featured results
            for (const slug of nonFeaturedSlugs) {
              expect(returnedSlugs).not.toContain(slug);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});

// =============================================================================
// Unit Tests for Category Page Filtering
// =============================================================================

describe("Category Page Filtering", () => {
  it("returns only articles matching the specified category", async () => {
    const articles: ArticleDef[] = [
      {
        slug: "tech-article-one",
        title: "Tech News",
        publishedAt: "2024-01-10",
        category: "tech",
        excerpt: "A tech article",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "placeholder",
        featured: false,
      },
      {
        slug: "politics-article-one",
        title: "Politics News",
        publishedAt: "2024-01-11",
        category: "politics",
        excerpt: "A politics article",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "placeholder",
        featured: true,
      },
      {
        slug: "tech-article-two",
        title: "More Tech",
        publishedAt: "2024-01-12",
        category: "tech",
        excerpt: "Another tech article",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "placeholder",
        featured: false,
      },
    ];

    const contentDir = await writeArticles(articles, "en");
    const techArticles = await getArticlesByCategory("tech", "en", contentDir);

    expect(techArticles).toHaveLength(2);
    expect(techArticles.every((a) => a.category === "tech")).toBe(true);
    expect(techArticles.map((a) => a.slug)).toContain("tech-article-one");
    expect(techArticles.map((a) => a.slug)).toContain("tech-article-two");
  });

  it("returns empty array when no articles match the category", async () => {
    const articles: ArticleDef[] = [
      {
        slug: "tech-only",
        title: "Tech Only",
        publishedAt: "2024-01-10",
        category: "tech",
        excerpt: "A tech article",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "placeholder",
        featured: false,
      },
    ];

    const contentDir = await writeArticles(articles, "en");
    const scienceArticles = await getArticlesByCategory(
      "science",
      "en",
      contentDir
    );

    expect(scienceArticles).toHaveLength(0);
  });
});

// =============================================================================
// Unit Tests for Article Page (getArticleBySlug)
// =============================================================================

describe("Article Page Rendering (getArticleBySlug)", () => {
  it("returns article with MDX content for a valid slug", async () => {
    const article: ArticleDef = {
      slug: "test-article",
      title: "Test Article Title",
      publishedAt: "2024-03-15",
      category: "local",
      excerpt: "This is a test excerpt",
      coverImage: "/images/articles/placeholder.jpg",
      coverImageAlt: "A test image",
      featured: true,
    };

    const contentDir = await writeArticles([article], "en");
    const result = await getArticleBySlug("test-article", "en", contentDir);

    expect(result).not.toBeNull();
    expect(result!.slug).toBe("test-article");
    expect(result!.title).toBe("Test Article Title");
    expect(result!.category).toBe("local");
    expect(result!.featured).toBe(true);
    expect(result!.content).toContain("Article body content for testing.");
  });

  it("returns null for a non-existent slug", async () => {
    const article: ArticleDef = {
      slug: "existing-article",
      title: "Existing",
      publishedAt: "2024-01-10",
      category: "tech",
      excerpt: "Exists",
      coverImage: "/images/articles/placeholder.jpg",
      coverImageAlt: "placeholder",
      featured: false,
    };

    const contentDir = await writeArticles([article], "en");
    const result = await getArticleBySlug(
      "non-existent-slug",
      "en",
      contentDir
    );

    expect(result).toBeNull();
  });

  it("returns correct language-specific article", async () => {
    const enArticle: ArticleDef = {
      slug: "shared-topic",
      title: "English Version",
      publishedAt: "2024-02-01",
      category: "local",
      excerpt: "English excerpt",
      coverImage: "/images/articles/placeholder.jpg",
      coverImageAlt: "english image",
      featured: false,
    };

    const taArticle: ArticleDef = {
      slug: "shared-topic",
      title: "Tamil Version",
      publishedAt: "2024-02-01",
      category: "local",
      excerpt: "Tamil excerpt",
      coverImage: "/images/articles/placeholder.jpg",
      coverImageAlt: "tamil image",
      featured: true,
    };

    // Write English articles
    const enDir = path.join(tempDir, "en");
    await mkdir(enDir, { recursive: true });
    await writeFile(
      path.join(enDir, `${enArticle.slug}.mdx`),
      articleToMdx(enArticle, "en"),
      "utf-8"
    );

    // Write Tamil articles
    const taDir = path.join(tempDir, "ta");
    await mkdir(taDir, { recursive: true });
    await writeFile(
      path.join(taDir, `${taArticle.slug}.mdx`),
      articleToMdx(taArticle, "ta"),
      "utf-8"
    );

    const enResult = await getArticleBySlug("shared-topic", "en", tempDir);
    const taResult = await getArticleBySlug("shared-topic", "ta", tempDir);

    expect(enResult).not.toBeNull();
    expect(enResult!.title).toBe("English Version");
    expect(enResult!.language).toBe("en");

    expect(taResult).not.toBeNull();
    expect(taResult!.title).toBe("Tamil Version");
    expect(taResult!.language).toBe("ta");
  });
});

// =============================================================================
// Unit Tests for Homepage (Featured Articles)
// =============================================================================

describe("Homepage Featured Articles", () => {
  it("homepage data includes all featured articles for the language", async () => {
    const articles: ArticleDef[] = [
      {
        slug: "featured-one",
        title: "Featured One",
        publishedAt: "2024-01-15",
        category: "politics",
        excerpt: "Featured article one",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "featured one",
        featured: true,
      },
      {
        slug: "not-featured",
        title: "Regular Article",
        publishedAt: "2024-01-14",
        category: "tech",
        excerpt: "Not featured",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "regular",
        featured: false,
      },
      {
        slug: "featured-two",
        title: "Featured Two",
        publishedAt: "2024-01-13",
        category: "local",
        excerpt: "Featured article two",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "featured two",
        featured: true,
      },
    ];

    const contentDir = await writeArticles(articles, "en");
    const featured = await getFeaturedArticles("en", contentDir);

    expect(featured).toHaveLength(2);
    expect(featured.map((a) => a.slug)).toContain("featured-one");
    expect(featured.map((a) => a.slug)).toContain("featured-two");
    expect(featured.map((a) => a.slug)).not.toContain("not-featured");
  });

  it("featured articles are sorted by date (newest first)", async () => {
    const articles: ArticleDef[] = [
      {
        slug: "older-featured",
        title: "Older Featured",
        publishedAt: "2024-01-01",
        category: "politics",
        excerpt: "Older",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "older",
        featured: true,
      },
      {
        slug: "newer-featured",
        title: "Newer Featured",
        publishedAt: "2024-01-20",
        category: "tech",
        excerpt: "Newer",
        coverImage: "/images/articles/placeholder.jpg",
        coverImageAlt: "newer",
        featured: true,
      },
    ];

    const contentDir = await writeArticles(articles, "ta");
    const featured = await getFeaturedArticles("ta", contentDir);

    expect(featured).toHaveLength(2);
    expect(featured[0].slug).toBe("newer-featured");
    expect(featured[1].slug).toBe("older-featured");
  });
});
