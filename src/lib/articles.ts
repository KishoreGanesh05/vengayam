import matter from "gray-matter";
import { readdir, readFile } from "fs/promises";
import path from "path";
import {
  type ArticleFrontmatter,
  type ArticleMeta,
  type Category,
  type Language,
  isValidCategory,
  isValidLanguage,
  CATEGORIES,
  LANGUAGES,
} from "./config";

// =============================================================================
// Custom Error Class
// =============================================================================

/**
 * Thrown when article frontmatter fails validation.
 * Includes the filename for context and a list of all validation errors found.
 */
export class ValidationError extends Error {
  public readonly filename: string | undefined;
  public readonly errors: string[];

  constructor(errors: string[], filename?: string) {
    const fileContext = filename ? ` in "${filename}"` : "";
    const message = `Frontmatter validation failed${fileContext}:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
    super(message);
    this.name = "ValidationError";
    this.filename = filename;
    this.errors = errors;
  }
}

// =============================================================================
// Frontmatter Parsing & Validation
// =============================================================================

/**
 * Parses raw MDX file content and validates the frontmatter against
 * the ArticleFrontmatter schema.
 *
 * Preconditions:
 *   - `raw` is non-empty string
 *   - `raw` begins with `---` YAML frontmatter delimiter
 *
 * Postconditions:
 *   - Returns valid ArticleFrontmatter object
 *   - Throws ValidationError if required fields missing
 *   - Throws ValidationError if field constraints violated
 *   - No side effects
 */
export function parseFrontmatter(
  raw: string,
  filename?: string
): ArticleFrontmatter {
  // Parse YAML frontmatter using gray-matter
  const { data } = matter(raw);
  const errors: string[] = [];

  // --- Required field presence checks ---
  if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
    errors.push("'title' is required and must be a non-empty string");
  }

  if (!data.author || typeof data.author !== "string" || data.author.trim() === "") {
    errors.push("'author' is required and must be a non-empty string");
  }

  if (!data.publishedAt) {
    errors.push("'publishedAt' is required");
  }

  if (!data.category) {
    errors.push("'category' is required");
  }

  if (!data.excerpt || typeof data.excerpt !== "string" || data.excerpt.trim() === "") {
    errors.push("'excerpt' is required and must be a non-empty string");
  }

  if (!data.coverImage || typeof data.coverImage !== "string" || data.coverImage.trim() === "") {
    errors.push("'coverImage' is required and must be a non-empty string");
  }

  if (!data.coverImageAlt || typeof data.coverImageAlt !== "string" || data.coverImageAlt.trim() === "") {
    errors.push("'coverImageAlt' is required and must be a non-empty string");
  }

  // --- Constraint checks (only if field is present) ---

  // Title: max 120 characters
  if (typeof data.title === "string" && data.title.trim() !== "" && data.title.length > 120) {
    errors.push(`'title' must be at most 120 characters (got ${data.title.length})`);
  }

  // Subtitle: optional, max 200 characters
  if (data.subtitle !== undefined && data.subtitle !== null) {
    if (typeof data.subtitle !== "string") {
      errors.push("'subtitle' must be a string");
    } else if (data.subtitle.length > 200) {
      errors.push(`'subtitle' must be at most 200 characters (got ${data.subtitle.length})`);
    }
  }

  // Excerpt: max 300 characters
  if (typeof data.excerpt === "string" && data.excerpt.trim() !== "" && data.excerpt.length > 300) {
    errors.push(`'excerpt' must be at most 300 characters (got ${data.excerpt.length})`);
  }

  // PublishedAt: valid ISO 8601 date
  if (data.publishedAt) {
    const publishedDate = new Date(data.publishedAt);
    if (isNaN(publishedDate.getTime())) {
      errors.push("'publishedAt' must be a valid ISO 8601 date");
    }
  }

  // UpdatedAt: optional, valid ISO 8601 date
  if (data.updatedAt !== undefined && data.updatedAt !== null) {
    const updatedDate = new Date(data.updatedAt);
    if (isNaN(updatedDate.getTime())) {
      errors.push("'updatedAt' must be a valid ISO 8601 date");
    }
  }

  // Category: must be a valid category
  if (data.category && !isValidCategory(String(data.category))) {
    errors.push(
      `'category' must be one of: ${CATEGORIES.join(", ")} (got "${data.category}")`
    );
  }

  // Language: must be "en" or "ta"
  if (data.language !== undefined && data.language !== null) {
    if (!isValidLanguage(String(data.language))) {
      errors.push(
        `'language' must be one of: ${LANGUAGES.join(", ")} (got "${data.language}")`
      );
    }
  }

  // --- Throw if any validation errors ---
  if (errors.length > 0) {
    throw new ValidationError(errors, filename);
  }

  // --- Build validated frontmatter object ---
  const frontmatter: ArticleFrontmatter = {
    title: data.title.trim(),
    author: data.author.trim(),
    publishedAt: String(data.publishedAt),
    category: data.category as Category,
    excerpt: data.excerpt.trim(),
    coverImage: data.coverImage.trim(),
    coverImageAlt: data.coverImageAlt.trim(),
    language: (data.language as Language) ?? inferLanguageFromFilename(filename),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    featured: data.featured === true,
  };

  // Optional fields
  if (data.subtitle) {
    frontmatter.subtitle = String(data.subtitle).trim();
  }
  if (data.updatedAt) {
    frontmatter.updatedAt = String(data.updatedAt);
  }

  return frontmatter;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Infers the language from the file path.
 * Looks for /en/ or /ta/ in the path.
 * Defaults to "en" if cannot be determined.
 */
function inferLanguageFromFilename(filename?: string): Language {
  if (!filename) return "en";
  if (filename.includes("/ta/") || filename.includes("\\ta\\")) return "ta";
  if (filename.includes("/en/") || filename.includes("\\en\\")) return "en";
  return "en";
}

// =============================================================================
// Content Directory
// =============================================================================

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), "content");

// =============================================================================
// Article Loading Functions
// =============================================================================

/**
 * Derives the article slug from a filename by stripping the .mdx extension.
 */
function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, "");
}

/**
 * Loads all articles for a given language.
 *
 * Reads MDX files from the language directory, parses frontmatter,
 * filters out future-dated articles, and sorts by publishedAt descending.
 *
 * Postconditions:
 *   - Returns all articles for the specified language sorted by publishedAt descending
 *   - Only articles with publishedAt <= now() are included
 *   - Each article has a valid slug derived from filename
 *   - All returned articles have language === specified language
 */
export async function loadAllArticles(
  language: Language,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<ArticleMeta[]> {
  const langDir = path.join(contentDir, language);

  let files: string[];
  try {
    const entries = await readdir(langDir);
    files = entries.filter((f) => f.endsWith(".mdx"));
  } catch {
    // Directory doesn't exist or is unreadable — return empty
    return [];
  }

  const articles: ArticleMeta[] = [];
  const now = new Date();

  for (const file of files) {
    const filePath = path.join(langDir, file);
    const raw = await readFile(filePath, "utf-8");
    const frontmatter = parseFrontmatter(raw, filePath);

    const publishedDate = new Date(frontmatter.publishedAt);

    // Skip future-dated articles
    if (publishedDate > now) {
      continue;
    }

    const slug = slugFromFilename(file);

    articles.push({
      slug,
      title: frontmatter.title,
      subtitle: frontmatter.subtitle,
      author: frontmatter.author,
      publishedAt: frontmatter.publishedAt,
      language,
      category: frontmatter.category,
      excerpt: frontmatter.excerpt,
      coverImage: frontmatter.coverImage,
      featured: frontmatter.featured,
    });
  }

  // Sort newest first
  return articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Loads a single article by slug and language, including the raw MDX content.
 *
 * Returns the article metadata plus the raw MDX content string.
 * Full MDX compilation is a React concern handled at render time.
 *
 * Returns null if the article file doesn't exist.
 */
export async function getArticleBySlug(
  slug: string,
  language: Language,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<(ArticleMeta & { content: string }) | null> {
  const filePath = path.join(contentDir, language, `${slug}.mdx`);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return null;
  }

  const frontmatter = parseFrontmatter(raw, filePath);
  const { content } = matter(raw);

  return {
    slug,
    title: frontmatter.title,
    subtitle: frontmatter.subtitle,
    author: frontmatter.author,
    publishedAt: frontmatter.publishedAt,
    language,
    category: frontmatter.category,
    excerpt: frontmatter.excerpt,
    coverImage: frontmatter.coverImage,
    featured: frontmatter.featured,
    content,
  };
}

/**
 * Returns articles filtered by category within a language, sorted by date descending.
 *
 * Postconditions:
 *   - All returned articles belong to the specified category AND language
 *   - Articles are sorted by publishedAt descending
 *   - Returns empty array if no articles match
 */
export async function getArticlesByCategory(
  category: Category,
  language: Language,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<ArticleMeta[]> {
  const allArticles = await loadAllArticles(language, contentDir);
  return allArticles.filter((article) => article.category === category);
}

/**
 * Returns articles marked as featured for a given language.
 *
 * Postconditions:
 *   - All returned articles have featured === true
 *   - Articles are sorted by publishedAt descending
 */
export async function getFeaturedArticles(
  language: Language,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<ArticleMeta[]> {
  const allArticles = await loadAllArticles(language, contentDir);
  return allArticles.filter((article) => article.featured);
}

/**
 * Returns related articles in the same category and language, excluding the current article.
 *
 * Postconditions:
 *   - Does NOT include article with currentSlug
 *   - All returned articles are in same category AND language
 *   - Sorted by publishedAt descending
 *   - Returns at most `limit` articles
 */
export async function getRelatedArticles(
  currentSlug: string,
  category: Category,
  language: Language,
  limit: number = 3,
  contentDir: string = DEFAULT_CONTENT_DIR
): Promise<ArticleMeta[]> {
  const categoryArticles = await getArticlesByCategory(
    category,
    language,
    contentDir
  );
  return categoryArticles
    .filter((article) => article.slug !== currentSlug)
    .slice(0, limit);
}
