import type { Language } from "./config";

// =============================================================================
// UI String Translations
// =============================================================================

export interface Translations {
  nav: {
    home: string;
    politics: string;
    tech: string;
    local: string;
    world: string;
    entertainment: string;
    science: string;
    opinion: string;
  };
  ui: {
    readMore: string;
    share: string;
    relatedArticles: string;
    featured: string;
    latestNews: string;
    allArticles: string;
    noArticles: string;
    copyLink: string;
    linkCopied: string;
    shareOn: string;
  };
  date: {
    publishedOn: string;
    updatedOn: string;
  };
  footer: {
    tagline: string;
    copyright: string;
    disclaimer: string;
  };
  languageSwitcher: {
    switchTo: string;
    label: string;
  };
}

const en: Translations = {
  nav: {
    home: "Home",
    politics: "Politics",
    tech: "Tech",
    local: "Local",
    world: "World",
    entertainment: "Entertainment",
    science: "Science",
    opinion: "Opinion",
  },
  ui: {
    readMore: "Read more",
    share: "Share",
    relatedArticles: "Related articles",
    featured: "Featured",
    latestNews: "Latest News",
    allArticles: "All Articles",
    noArticles: "No articles found",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    shareOn: "Share on",
  },
  date: {
    publishedOn: "Published on",
    updatedOn: "Updated on",
  },
  footer: {
    tagline: "India's finest source of satirical news",
    copyright: "© {year} Vengayam. All rights reserved.",
    disclaimer: "All stories are satirical. Any resemblance to actual events is purely coincidental.",
  },
  languageSwitcher: {
    switchTo: "தமிழ்",
    label: "Switch language",
  },
};

const ta: Translations = {
  nav: {
    home: "முகப்பு",
    politics: "அரசியல்",
    tech: "தொழில்நுட்பம்",
    local: "உள்ளூர்",
    world: "உலகம்",
    entertainment: "பொழுதுபோக்கு",
    science: "அறிவியல்",
    opinion: "கருத்து",
  },
  ui: {
    readMore: "மேலும் படிக்க",
    share: "பகிர்",
    relatedArticles: "தொடர்புடைய கட்டுரைகள்",
    featured: "சிறப்புக் கட்டுரை",
    latestNews: "சமீபத்திய செய்திகள்",
    allArticles: "அனைத்து கட்டுரைகள்",
    noArticles: "கட்டுரைகள் எதுவும் இல்லை",
    copyLink: "இணைப்பை நகலெடு",
    linkCopied: "இணைப்பு நகலெடுக்கப்பட்டது!",
    shareOn: "பகிர்",
  },
  date: {
    publishedOn: "வெளியிடப்பட்டது",
    updatedOn: "புதுப்பிக்கப்பட்டது",
  },
  footer: {
    tagline: "இந்தியாவின் சிறந்த நையாண்டி செய்தி ஆதாரம்",
    copyright: "© {year} வெங்காயம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    disclaimer: "அனைத்து கதைகளும் நையாண்டி. நிஜ நிகழ்வுகளுடன் ஒற்றுமை தற்செயலானது.",
  },
  languageSwitcher: {
    switchTo: "English",
    label: "மொழியை மாற்று",
  },
};

const translations: Record<Language, Translations> = { en, ta };

/**
 * Get UI string translations for a given language.
 */
export function getTranslations(language: Language): Translations {
  return translations[language];
}

/**
 * Get a specific translation string with interpolation.
 * Supports simple {key} placeholders.
 */
export function t(
  language: Language,
  path: string,
  vars?: Record<string, string>
): string {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[language];

  for (const part of parts) {
    if (value == null) return path;
    value = value[part];
  }

  if (typeof value !== "string") return path;

  if (vars) {
    return value.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  }

  return value;
}
