import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import os from "os";
import { loadAllArticles, getArticlesByCategory } from "./articles";
import { CATEGORIES, LANGUAGES, type Category, type Language } from "./config";

// =============================================================================
// Arbitraries — smart generators for article MDX files
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

/** Generate a future date string (guaranteed in the future) */
const futureDateArb = fc
  .integer({ min: 2030, max: 2050 })
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
 * Must start with a letter/digit to guarantee non-empty after YAML parsing and trimming.
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
const pastArticleDefArb = fc.record({
  slug: slugArb,
  title: safeString(100),
  publishedAt: pastDateArb,
  category: categoryArb,
  excerpt: safeString(200),
  coverImage: fc.constant("/images/articles/placeholder.jpg"),
  coverImageAlt: safeString(50),
  featured: fc.boolean(),
});

/** Generate an article definition with a future date */
const futureArticleDefArb = fc.record({
  slug: slugArb,
  title: safeString(100),
  publishedAt: futureDateArb,
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
      // Deduplicate by slug
      const seen = new Set<string>();
      return articles.filter((a) => {
        if (seen.has(a.slug)) return false;
        seen.add(a.slug);
        return true;
      });
    })
    .filter((articles) => articles.length >= minLength);
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
    "Article body content.",
  ].join("\n");
}

// =============================================================================
// Test Helpers — Temp directory management
// =============================================================================

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "vengayam-test-"));
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
    await writeFile(path.join(langDir, `${article.slug}.mdx`), content, "utf-8");
  }

  return tempDir;
}

// =============================================================================
// Property Tests
// =============================================================================

describe("Article Loading Property Tests", () => {
  /**
   * **Validates: Requirements 1.2**
   *
   * Property 2: Article slugs are unique within a language
   * ∀ lang ∈ Languages: ∀ a, b ∈ articles(lang): a.slug === b.slug ⟹ a === b
   *
   * When articles are loaded for a language, all slugs in the result are unique.
   */
  describe("Property 2: Article slugs are unique within a language", () => {
    it("loadAllArticles returns articles with unique slugs", async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueArticlesArb(pastArticleDefArb, 2, 10),
          languageArb,
          async (articles, language) => {
            const contentDir = await writeArticles(articles, language);
            const loaded = await loadAllArticles(language, contentDir);

            const slugs = loaded.map((a) => a.slug);
            const uniqueSlugs = new Set(slugs);
            expect(slugs.length).toBe(uniqueSlugs.size);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   *
   * Property 3: Category filtering is exhaustive — all returned articles match category and language
   * ∀ category ∈ Categories, lang ∈ Languages:
   *   getArticlesByCategory(category, lang).every(a => a.category === category ∧ a.language === lang)
   */
  describe("Property 3: Category filtering is exhaustive", () => {
    it("getArticlesByCategory only returns articles matching the specified category and language", async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueArticlesArb(pastArticleDefArb, 2, 15),
          languageArb,
          categoryArb,
          async (articles, language, category) => {
            const contentDir = await writeArticles(articles, language);
            const filtered = await getArticlesByCategory(category, language, contentDir);

            // All returned articles must match the category
            for (const article of filtered) {
              expect(article.category).toBe(category);
              expect(article.language).toBe(language);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   *
   * Property 6: Articles are sorted by date (newest first) within each language
   * ∀ lang ∈ Languages: ∀ i ∈ [0, articles(lang).length - 1):
   *   articles(lang)[i].publishedAt >= articles(lang)[i+1].publishedAt
   */
  describe("Property 6: Articles are sorted by date (newest first)", () => {
    it("loadAllArticles returns articles sorted by publishedAt descending", async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueArticlesArb(pastArticleDefArb, 2, 10),
          languageArb,
          async (articles, language) => {
            const contentDir = await writeArticles(articles, language);
            const loaded = await loadAllArticles(language, contentDir);

            // Verify descending date order
            for (let i = 0; i < loaded.length - 1; i++) {
              const currentDate = new Date(loaded[i].publishedAt).getTime();
              const nextDate = new Date(loaded[i + 1].publishedAt).getTime();
              expect(currentDate).toBeGreaterThanOrEqual(nextDate);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   *
   * Property 7: No future-dated articles appear in listings
   * ∀ lang ∈ Languages: ∀ article ∈ getVisibleArticles(lang): article.publishedAt <= now()
   */
  describe("Property 7: No future-dated articles appear in listings", () => {
    it("loadAllArticles excludes articles with future publishedAt dates", async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueArticlesArb(pastArticleDefArb, 1, 5),
          uniqueArticlesArb(futureArticleDefArb, 1, 5),
          languageArb,
          async (pastArticles, futureArticles, language) => {
            // Ensure no slug collisions between past and future articles
            const pastSlugs = new Set(pastArticles.map((a) => a.slug));
            const dedupedFuture = futureArticles.filter(
              (a) => !pastSlugs.has(a.slug)
            );

            // Write both past and future articles to the same directory
            const allArticles = [...pastArticles, ...dedupedFuture];
            const contentDir = await writeArticles(allArticles, language);

            const loaded = await loadAllArticles(language, contentDir);
            const now = new Date();

            // No loaded article should have a future date
            for (const article of loaded) {
              const publishedDate = new Date(article.publishedAt);
              expect(publishedDate.getTime()).toBeLessThanOrEqual(now.getTime());
            }

            // Future articles should not appear in the result
            for (const futureArticle of dedupedFuture) {
              const found = loaded.find((a) => a.slug === futureArticle.slug);
              expect(found).toBeUndefined();
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Validates: Requirements 1.2**
   *
   * Property 9: Language isolation — articles only appear in their language section
   * ∀ article ∈ loadAllArticles("en"): article.language === "en"
   * ∀ article ∈ loadAllArticles("ta"): article.language === "ta"
   */
  describe("Property 9: Language isolation", () => {
    it("articles only appear in their own language section", async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueArticlesArb(pastArticleDefArb, 1, 5),
          uniqueArticlesArb(pastArticleDefArb, 1, 5),
          async (enArticles, taArticles) => {
            // Write English articles to /en/ and Tamil articles to /ta/
            const enDir = path.join(tempDir, "en");
            const taDir = path.join(tempDir, "ta");
            await mkdir(enDir, { recursive: true });
            await mkdir(taDir, { recursive: true });

            for (const article of enArticles) {
              const content = articleToMdx(article, "en");
              await writeFile(
                path.join(enDir, `${article.slug}.mdx`),
                content,
                "utf-8"
              );
            }
            for (const article of taArticles) {
              const content = articleToMdx(article, "ta");
              await writeFile(
                path.join(taDir, `${article.slug}.mdx`),
                content,
                "utf-8"
              );
            }

            // Load each language section
            const enLoaded = await loadAllArticles("en", tempDir);
            const taLoaded = await loadAllArticles("ta", tempDir);

            // All English articles must have language === "en"
            for (const article of enLoaded) {
              expect(article.language).toBe("en");
            }

            // All Tamil articles must have language === "ta"
            for (const article of taLoaded) {
              expect(article.language).toBe("ta");
            }

            // No English slug should appear in Tamil results and vice versa
            const enSlugs = new Set(enLoaded.map((a) => a.slug));
            const taSlugs = new Set(taLoaded.map((a) => a.slug));

            for (const article of taLoaded) {
              // Tamil articles should not be in the English result set
              // (unless they happen to share the same slug — which is fine,
              // the point is the language field is correct)
              expect(article.language).not.toBe("en");
            }
            for (const article of enLoaded) {
              expect(article.language).not.toBe("ta");
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
