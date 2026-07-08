"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Language } from "@/lib/config";
import { getTranslations } from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentLanguage: Language;
}

/**
 * Language switcher that toggles between /en/ and /ta/ routes.
 * Replaces the language prefix in the current URL path.
 */
export default function LanguageSwitcher({
  currentLanguage,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const translations = getTranslations(currentLanguage);
  const targetLanguage: Language = currentLanguage === "en" ? "ta" : "en";

  // Replace the current language prefix with the target language
  const targetPath = pathname.replace(
    new RegExp(`^/${currentLanguage}(/|$)`),
    `/${targetLanguage}$1`
  );

  return (
    <Link
      href={targetPath}
      lang={targetLanguage}
      aria-label={translations.languageSwitcher.label}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      <span aria-hidden="true" className="text-base">
        {targetLanguage === "ta" ? "🇮🇳" : "🌐"}
      </span>
      <span>{translations.languageSwitcher.switchTo}</span>
    </Link>
  );
}
