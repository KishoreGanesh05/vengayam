// =============================================================================
// Shared Utilities
// =============================================================================

/**
 * Supported share platforms.
 */
export type SharePlatform = "twitter" | "facebook" | "linkedin";

/**
 * Generate a platform-specific share dialog URL.
 *
 * Preconditions:
 *   - `platform` is one of the supported platforms
 *   - `articleUrl` is a valid absolute URL
 *   - `title` is non-empty
 *
 * Postconditions:
 *   - Returns a valid URL string for the platform's share dialog
 *   - URL-encodes the article URL and title
 *   - No side effects
 */
export function generateShareUrl(
  platform: SharePlatform,
  articleUrl: string,
  title: string
): string {
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
}
