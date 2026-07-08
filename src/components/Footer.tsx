"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig, type Language, isValidLanguage } from "@/lib/config";

/**
 * Extracts the current language from the pathname.
 * Falls back to the site's default language if not found.
 */
function useCurrentLanguage(): Language {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const langSegment = segments[0];
  if (langSegment && isValidLanguage(langSegment)) {
    return langSegment;
  }
  return siteConfig.defaultLanguage;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const language = useCurrentLanguage();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Site info */}
          <div>
            <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white">
              {siteConfig.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {siteConfig.description}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              {siteConfig.descriptionTamil}
            </p>
          </div>

          {/* Quick links — language-aware */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              {language === "ta" ? "பிரிவுகள்" : "Categories"}
            </h3>
            <ul className="mt-3 space-y-2">
              {siteConfig.categories.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/${language}/category/${category.slug}`}
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    {language === "ta" ? category.labelTamil : category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              {language === "ta" ? "எங்களைத் தொடருங்கள்" : "Follow Us"}
            </h3>
            <ul className="mt-3 space-y-2">
              {siteConfig.socialLinks.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 capitalize transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <SocialIcon platform={link.platform} />
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="text-center text-sm text-gray-500 dark:text-gray-500">
            &copy; {currentYear} {siteConfig.name}. All content is satirical and fictional.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Simple SVG icons for social platforms */
function SocialIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "twitter":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
  }
}
