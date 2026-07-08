"use client";

import { useState } from "react";
import type { Language } from "@/lib/config";
import { generateShareUrl } from "@/lib/utils";
import { getTranslations } from "@/lib/i18n";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  language: Language;
}

/**
 * Social share buttons for Twitter/X, Facebook, LinkedIn, and copy-link.
 * Opens share dialogs in new windows. Copy-link writes to clipboard with
 * a brief "copied" confirmation state.
 */
export default function ShareButtons({
  url,
  title,
  language,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const t = getTranslations(language);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {t.ui.share}
      </span>

      {/* Twitter/X */}
      <a
        href={generateShareUrl("twitter", url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t.ui.shareOn} Twitter`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href={generateShareUrl("facebook", url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t.ui.shareOn} Facebook`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.044 1.543.108v3.23c-.168-.018-.46-.027-.824-.027-1.17 0-1.623.443-1.623 1.596v2.651h2.355l-.41 3.667h-1.945v8.116A12.004 12.004 0 0 0 12 24c-.326 0-.649-.014-.969-.04a11.96 11.96 0 0 1-1.93-.269z" />
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href={generateShareUrl("linkedin", url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t.ui.shareOn} LinkedIn`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        aria-label={copied ? t.ui.linkCopied : t.ui.copyLink}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {copied ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{t.ui.linkCopied}</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{t.ui.copyLink}</span>
          </>
        )}
      </button>
    </div>
  );
}
