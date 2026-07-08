// =============================================================================
// Type Definitions
// =============================================================================

/** Supported languages */
export type Language = "en" | "ta";

/** Article categories */
export type Category =
  | "politics"
  | "tech"
  | "local"
  | "world"
  | "entertainment"
  | "science"
  | "opinion";

/** Full article with rendered MDX content */
export interface Article {
  slug: string;
  title: string;
  subtitle?: string;
  publishedAt: string; // ISO 8601
  updatedAt?: string;
  language: Language;
  category: Category;
  tags: string[];
  excerpt: string;
  coverImage: string;
  coverImageAlt: string;
  featured: boolean;
  content: MDXContent;
}

/** Compiled MDX content (React component) */
export type MDXContent = React.ComponentType<Record<string, unknown>>;

/** Article metadata for listings (without full content) */
export interface ArticleMeta {
  slug: string;
  title: string;
  subtitle?: string;
  publishedAt: string;
  language: Language;
  category: Category;
  excerpt: string;
  coverImage: string;
  featured: boolean;
}

/** Frontmatter schema validated at build time */
export interface ArticleFrontmatter {
  title: string; // Required, max 120 chars
  subtitle?: string; // Optional, max 200 chars
  publishedAt: string; // Required, ISO 8601 date
  updatedAt?: string; // Optional, ISO 8601 date
  language: Language; // Required, "en" or "ta" — inferred from content directory
  category: Category; // Required, must be valid category
  tags: string[]; // Optional, for future filtering
  excerpt: string; // Required, max 300 chars, used in listings & SEO
  coverImage: string; // Required, path relative to /public
  coverImageAlt: string; // Required, accessibility
  featured: boolean; // Default false, shows on homepage hero
}

// =============================================================================
// Site Configuration Types
// =============================================================================

export interface SiteConfig {
  name: string;
  description: string;
  descriptionTamil: string;
  url: string;
  author: string;
  defaultLanguage: Language;
  supportedLanguages: Language[];
  categories: CategoryConfig[];
  socialLinks: SocialLink[];
  navigation: NavigationItem[];
}

export interface CategoryConfig {
  slug: Category;
  label: string;
  labelTamil: string;
  description: string;
  color: string; // For UI accent (Tailwind color class)
}

export interface NavigationItem {
  label: string;
  labelTamil?: string;
  href: string;
  category?: Category;
}

export interface SocialLink {
  platform: string;
  url: string;
}

// =============================================================================
// Constants
// =============================================================================

export const CATEGORIES: Category[] = [
  "politics",
  "tech",
  "local",
  "world",
  "entertainment",
  "science",
  "opinion",
];

export const LANGUAGES: Language[] = ["en", "ta"];

// =============================================================================
// Category Configurations
// =============================================================================

export const categoryConfigs: CategoryConfig[] = [
  {
    slug: "politics",
    label: "Politics",
    labelTamil: "அரசியல்",
    description: "Satirical takes on political events and governance",
    color: "red",
  },
  {
    slug: "tech",
    label: "Tech",
    labelTamil: "தொழில்நுட்பம்",
    description: "Humorous commentary on technology and startups",
    color: "blue",
  },
  {
    slug: "local",
    label: "Local",
    labelTamil: "உள்ளூர்",
    description: "Fictional local news and community stories",
    color: "green",
  },
  {
    slug: "world",
    label: "World",
    labelTamil: "உலகம்",
    description: "Satirical international news coverage",
    color: "purple",
  },
  {
    slug: "entertainment",
    label: "Entertainment",
    labelTamil: "பொழுதுபோக்கு",
    description: "Fake celebrity news and entertainment satire",
    color: "pink",
  },
  {
    slug: "science",
    label: "Science",
    labelTamil: "அறிவியல்",
    description: "Humorous takes on scientific discoveries",
    color: "teal",
  },
  {
    slug: "opinion",
    label: "Opinion",
    labelTamil: "கருத்து",
    description: "Satirical opinion columns and editorials",
    color: "orange",
  },
];

// =============================================================================
// Site Configuration
// =============================================================================

export const siteConfig: SiteConfig = {
  name: "Vengayam",
  description: "India's finest source of satirical news",
  descriptionTamil: "இந்தியாவின் சிறந்த நையாண்டி செய்தி ஆதாரம்",
  url: "https://vengayam.in",
  author: "Vengayam Staff",
  defaultLanguage: "en",
  supportedLanguages: ["en", "ta"],
  categories: categoryConfigs,
  socialLinks: [
    { platform: "twitter", url: "https://twitter.com/vengayam" },
    { platform: "instagram", url: "https://instagram.com/vengayam" },
  ],
  navigation: [
    { label: "Home", labelTamil: "முகப்பு", href: "/" },
    {
      label: "Politics",
      labelTamil: "அரசியல்",
      href: "/category/politics",
      category: "politics",
    },
    {
      label: "Tech",
      labelTamil: "தொழில்நுட்பம்",
      href: "/category/tech",
      category: "tech",
    },
    {
      label: "Local",
      labelTamil: "உள்ளூர்",
      href: "/category/local",
      category: "local",
    },
    {
      label: "World",
      labelTamil: "உலகம்",
      href: "/category/world",
      category: "world",
    },
    {
      label: "Entertainment",
      labelTamil: "பொழுதுபோக்கு",
      href: "/category/entertainment",
      category: "entertainment",
    },
    {
      label: "Science",
      labelTamil: "அறிவியல்",
      href: "/category/science",
      category: "science",
    },
    {
      label: "Opinion",
      labelTamil: "கருத்து",
      href: "/category/opinion",
      category: "opinion",
    },
  ],
};

// =============================================================================
// Helper Functions
// =============================================================================

/** Get category config by slug */
export function getCategoryConfig(slug: Category): CategoryConfig {
  const config = categoryConfigs.find((c) => c.slug === slug);
  if (!config) {
    throw new Error(`Unknown category: ${slug}`);
  }
  return config;
}

/** Get category label for a given language */
export function getCategoryLabel(slug: Category, language: Language): string {
  const config = getCategoryConfig(slug);
  return language === "ta" ? config.labelTamil : config.label;
}

/** Check if a string is a valid category */
export function isValidCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}

/** Check if a string is a valid language */
export function isValidLanguage(value: string): value is Language {
  return LANGUAGES.includes(value as Language);
}
