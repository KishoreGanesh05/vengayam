import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parseFrontmatter, ValidationError } from "./articles";
import { CATEGORIES, LANGUAGES } from "./config";

// =============================================================================
// Arbitraries — smart generators for frontmatter fields
// =============================================================================

/** Generate a valid ISO 8601 date string (past dates only, to satisfy publishedAt <= now()) */
const pastDateArb = fc
  .integer({
    min: new Date("2000-01-01").getTime(),
    max: Date.now(),
  })
  .map((ts) => new Date(ts).toISOString().split("T")[0]); // "YYYY-MM-DD"

/**
 * Generate a non-empty string of at most `maxLen` characters.
 * Ensures at least one non-whitespace character (since parseFrontmatter trims values).
 */
function nonEmptyString(maxLen: number) {
  return fc.stringMatching(/^[A-Za-z0-9.,!?'-][A-Za-z0-9 .,!?'-]*$/, {
    minLength: 1,
    maxLength: maxLen,
  });
}

/** Generate a valid category */
const categoryArb = fc.constantFrom(...CATEGORIES);

/** Generate a valid language */
const languageArb = fc.constantFrom(...LANGUAGES);

/** Generate a valid cover image path */
const coverImageArb = fc
  .stringMatching(/^[a-z0-9-]+$/, { minLength: 1, maxLength: 20 })
  .map((name) => `/images/articles/${name}.jpg`);

/** Generate a valid non-empty coverImageAlt string */
const coverImageAltArb = nonEmptyString(100);

/** Generate valid complete frontmatter data as a YAML string */
const validFrontmatterArb = fc
  .record({
    title: nonEmptyString(120),
    author: nonEmptyString(50),
    publishedAt: pastDateArb,
    category: categoryArb,
    language: languageArb,
    excerpt: nonEmptyString(300),
    coverImage: coverImageArb,
    coverImageAlt: coverImageAltArb,
    featured: fc.boolean(),
  })
  .map((data) => {
    return [
      "---",
      `title: "${escapeYaml(data.title)}"`,
      `author: "${escapeYaml(data.author)}"`,
      `publishedAt: "${data.publishedAt}"`,
      `category: "${data.category}"`,
      `language: "${data.language}"`,
      `excerpt: "${escapeYaml(data.excerpt)}"`,
      `coverImage: "${data.coverImage}"`,
      `coverImageAlt: "${escapeYaml(data.coverImageAlt)}"`,
      `featured: ${data.featured}`,
      "---",
      "",
      "Article body content here.",
    ].join("\n");
  });

/** Escape characters that would break YAML double-quoted strings */
function escapeYaml(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// =============================================================================
// Property Tests
// =============================================================================

describe("Frontmatter Property Tests", () => {
  /**
   * **Validates: Requirements 1**
   *
   * Property 1: All published articles have valid dates
   * ∀ article ∈ publishedArticles: isValidDate(article.publishedAt) ∧ article.publishedAt <= now()
   *
   * When valid frontmatter with a valid past date is parsed,
   * the resulting publishedAt is always a valid date not in the future.
   */
  describe("Property 1: All published articles have valid dates", () => {
    it("parseFrontmatter always produces a valid, parseable date for publishedAt", () => {
      fc.assert(
        fc.property(validFrontmatterArb, (raw) => {
          const result = parseFrontmatter(raw);
          const parsedDate = new Date(result.publishedAt);

          // The date must be valid (not NaN)
          expect(parsedDate.getTime()).not.toBeNaN();

          // The date must not be in the future
          expect(parsedDate.getTime()).toBeLessThanOrEqual(Date.now());
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 8**
   *
   * Property 8: Cover images have alt text (accessibility)
   * ∀ article ∈ allArticles: article.coverImageAlt.length > 0
   *
   * When valid frontmatter is parsed, the resulting coverImageAlt is always non-empty.
   * When frontmatter has empty coverImageAlt, parseFrontmatter always throws a ValidationError.
   */
  describe("Property 8: Cover images have alt text (accessibility)", () => {
    it("parseFrontmatter always produces a non-empty coverImageAlt for valid input", () => {
      fc.assert(
        fc.property(validFrontmatterArb, (raw) => {
          const result = parseFrontmatter(raw);

          // coverImageAlt must always be non-empty
          expect(result.coverImageAlt.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("parseFrontmatter throws ValidationError when coverImageAlt is empty", () => {
      // Generate frontmatter with an empty coverImageAlt
      const emptyAltFrontmatterArb = fc
        .record({
          title: nonEmptyString(120),
          author: nonEmptyString(50),
          publishedAt: pastDateArb,
          category: categoryArb,
          language: languageArb,
          excerpt: nonEmptyString(300),
          coverImage: coverImageArb,
          featured: fc.boolean(),
        })
        .map((data) => {
          return [
            "---",
            `title: "${escapeYaml(data.title)}"`,
            `author: "${escapeYaml(data.author)}"`,
            `publishedAt: "${data.publishedAt}"`,
            `category: "${data.category}"`,
            `language: "${data.language}"`,
            `excerpt: "${escapeYaml(data.excerpt)}"`,
            `coverImage: "${data.coverImage}"`,
            `coverImageAlt: ""`,
            `featured: ${data.featured}`,
            "---",
            "",
            "Article body content here.",
          ].join("\n");
        });

      fc.assert(
        fc.property(emptyAltFrontmatterArb, (raw) => {
          expect(() => parseFrontmatter(raw)).toThrow(ValidationError);
        }),
        { numRuns: 100 }
      );
    });
  });
});
