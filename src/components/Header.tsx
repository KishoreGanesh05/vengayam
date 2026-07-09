"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig, type Language, isValidLanguage } from "@/lib/config";
import { getTranslations } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

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

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const language = useCurrentLanguage();
  const t = getTranslations(language);

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top bar: site name + language switcher + mobile toggle */}
        <div className="flex items-center justify-between py-4">
          {/* Site name / logo */}
          <Link href={`/${language}/`} className="flex items-center gap-2">
            <Image
              src="/images/site/vengayam_logo.png"
              alt="Vengayam"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-heading text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {siteConfig.name}
            </span>
          </Link>

          {/* Language switcher (desktop) */}
          <div className="hidden items-center gap-4 md:flex">
            <LanguageSwitcher currentLanguage={language} />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 md:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden border-t border-gray-100 md:block dark:border-gray-800" aria-label="Main navigation">
          <ul className="flex items-center gap-1 overflow-x-auto py-2">
            {siteConfig.navigation.map((item) => {
              // Prepend language prefix to navigation hrefs
              const href = item.href === "/"
                ? `/${language}/`
                : `/${language}${item.href}`;
              const label = language === "ta" && item.labelTamil
                ? item.labelTamil
                : item.label;

              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-gray-200 md:hidden dark:border-gray-800" aria-label="Mobile navigation">
          <div className="space-y-1 px-4 py-3">
            {/* Language switcher (mobile) */}
            <div className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              <LanguageSwitcher currentLanguage={language} />
            </div>

            {siteConfig.navigation.map((item) => {
              const href = item.href === "/"
                ? `/${language}/`
                : `/${language}${item.href}`;
              const label = language === "ta" && item.labelTamil
                ? item.labelTamil
                : item.label;

              return (
                <Link
                  key={item.href}
                  href={href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
