import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import {
  loadAllArticles,
  getArticleBySlug,
  getArticlesByCategory,
  getFeaturedArticles,
  getRelatedArticles,
} from "./articles";

const TEST_CONTENT_DIR = path.join(process.cwd(), "test-content-articles");

function makeMdx(frontmatter: Record<string, unknown>, body: string = "Article body."): string {
  const lines = Object.entries(frontmatter).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    if (typeof value === "boolean") return `${key}: ${value}`;
    return `${key}: "${value}"`;
  });
  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}

const baseFrontmatter = {
  title: "Test Article",
  author: "Test Author",
  publishedAt: "2024-01-10",
  category: "tech",
  tags: ["test"],
  excerpt: "A test excerpt.",
  coverImage: "/images/test.jpg",
  coverImageAlt: "Test image",
  featured: false,
};

describe("Article Loading Functions", () => {
  beforeAll(async () => {
    // Create test content directory structure
    await mkdir(path.join(TEST_CONTENT_DIR, "en"), { recursive: true });
    await mkdir(path.join(TEST_CONTENT_DIR, "ta"), { recursive: true });

    // English articles
    await writeFile(
      path.join(TEST_CONTENT_DIR, "en", "article-one.mdx"),
      makeMdx({ ...baseFrontmatter, title: "Article One", publishedAt: "2024-01-15", featured: true })
    );
    await writeFile(
      path.join(TEST_CONTENT_DIR, "en", "article-two.mdx"),
      makeMdx({ ...baseFrontmatter, title: "Article Two", publishedAt: "2024-01-10", category: "local" })
    );
    await writeFile(
      path.join(TEST_CONTENT_DIR, "en", "article-three.mdx"),
      makeMdx({ ...baseFrontmatter, title: "Article Three", publishedAt: "2024-01-20", category: "tech", featured: true })
    );
    // Future-dated article (should be excluded)
    await writeFile(
      path.join(TEST_CONTENT_DIR, "en", "future-article.mdx"),
      makeMdx({ ...baseFrontmatter, title: "Future Article", publishedAt: "2099-12-31" })
    );

    // Tamil articles
    await writeFile(
      path.join(TEST_CONTENT_DIR, "ta", "tamil-article.mdx"),
      makeMdx({ ...baseFrontmatter, title: "Tamil Article", publishedAt: "2024-01-12", category: "local", featured: true })
    );
  });

  afterAll(async () => {
    await rm(TEST_CONTENT_DIR, { recursive: true, force: true });
  });

  describe("loadAllArticles", () => {
    it("loads all English articles excluding future-dated", async () => {
      const articles = await loadAllArticles("en", TEST_CONTENT_DIR);
      expect(articles).toHaveLength(3);
      // Should not include future article
      expect(articles.find((a) => a.slug === "future-article")).toBeUndefined();
    });

    it("sorts articles by publishedAt descending (newest first)", async () => {
      const articles = await loadAllArticles("en", TEST_CONTENT_DIR);
      for (let i = 0; i < articles.length - 1; i++) {
        expect(new Date(articles[i].publishedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(articles[i + 1].publishedAt).getTime()
        );
      }
    });

    it("derives slug from filename", async () => {
      const articles = await loadAllArticles("en", TEST_CONTENT_DIR);
      const slugs = articles.map((a) => a.slug);
      expect(slugs).toContain("article-one");
      expect(slugs).toContain("article-two");
      expect(slugs).toContain("article-three");
    });

    it("sets language correctly on all articles", async () => {
      const enArticles = await loadAllArticles("en", TEST_CONTENT_DIR);
      enArticles.forEach((a) => expect(a.language).toBe("en"));

      const taArticles = await loadAllArticles("ta", TEST_CONTENT_DIR);
      taArticles.forEach((a) => expect(a.language).toBe("ta"));
    });

    it("returns empty array for non-existent language directory", async () => {
      const articles = await loadAllArticles("en", "/nonexistent/path");
      expect(articles).toEqual([]);
    });
  });

  describe("getArticleBySlug", () => {
    it("loads article with content", async () => {
      const article = await getArticleBySlug("article-one", "en", TEST_CONTENT_DIR);
      expect(article).not.toBeNull();
      expect(article!.slug).toBe("article-one");
      expect(article!.title).toBe("Article One");
      expect(article!.content).toContain("Article body.");
    });

    it("returns null for non-existent slug", async () => {
      const article = await getArticleBySlug("nonexistent", "en", TEST_CONTENT_DIR);
      expect(article).toBeNull();
    });
  });

  describe("getArticlesByCategory", () => {
    it("filters articles by category", async () => {
      const techArticles = await getArticlesByCategory("tech", "en", TEST_CONTENT_DIR);
      techArticles.forEach((a) => expect(a.category).toBe("tech"));

      const localArticles = await getArticlesByCategory("local", "en", TEST_CONTENT_DIR);
      localArticles.forEach((a) => expect(a.category).toBe("local"));
    });

    it("returns empty array when no articles match", async () => {
      const articles = await getArticlesByCategory("politics", "en", TEST_CONTENT_DIR);
      expect(articles).toEqual([]);
    });
  });

  describe("getFeaturedArticles", () => {
    it("returns only featured articles", async () => {
      const featured = await getFeaturedArticles("en", TEST_CONTENT_DIR);
      featured.forEach((a) => expect(a.featured).toBe(true));
      expect(featured.length).toBeGreaterThan(0);
    });

    it("sorts featured articles by date descending", async () => {
      const featured = await getFeaturedArticles("en", TEST_CONTENT_DIR);
      for (let i = 0; i < featured.length - 1; i++) {
        expect(new Date(featured[i].publishedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(featured[i + 1].publishedAt).getTime()
        );
      }
    });
  });

  describe("getRelatedArticles", () => {
    it("excludes the current article", async () => {
      const related = await getRelatedArticles("article-one", "tech", "en", 10, TEST_CONTENT_DIR);
      expect(related.find((a) => a.slug === "article-one")).toBeUndefined();
    });

    it("returns only articles in the same category", async () => {
      const related = await getRelatedArticles("article-one", "tech", "en", 10, TEST_CONTENT_DIR);
      related.forEach((a) => expect(a.category).toBe("tech"));
    });

    it("limits the number of returned articles", async () => {
      const related = await getRelatedArticles("article-one", "tech", "en", 1, TEST_CONTENT_DIR);
      expect(related.length).toBeLessThanOrEqual(1);
    });

    it("returns empty array when no related articles exist", async () => {
      const related = await getRelatedArticles("article-two", "local", "en", 10, TEST_CONTENT_DIR);
      expect(related).toEqual([]);
    });
  });
});
