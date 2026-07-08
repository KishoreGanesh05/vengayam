import { notFound } from "next/navigation";
import { isValidLanguage, LANGUAGES } from "@/lib/config";
import type { Language } from "@/lib/config";

/**
 * Generate static params for all supported languages.
 */
export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

/**
 * Language-specific layout that applies the correct font classes
 * and direction for the current language.
 *
 * - English (/en/): uses font-heading (Lora) + font-body (Inter)
 * - Tamil (/ta/): uses font-tamil (Noto Sans Tamil)
 *
 * Both languages are LTR.
 */
export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const language = lang as Language;

  // Apply language-specific font classes
  // Tamil: uses .font-tamil (Noto Sans Tamil) for all text
  // English: body already uses --font-body (Inter); headings use .font-heading (Lora) via prose
  const fontClass = language === "ta" ? "font-tamil" : "";

  return (
    <div lang={language} dir="ltr" className={fontClass}>
      {children}
    </div>
  );
}
