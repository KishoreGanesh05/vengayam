import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateShareUrl, SharePlatform } from "./utils";

// =============================================================================
// Arbitraries — smart generators for share URL inputs
// =============================================================================

/** Generate a valid absolute HTTPS URL */
const validUrlArb = fc
  .record({
    domain: fc.stringMatching(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      minLength: 1,
      maxLength: 20,
    }),
    tld: fc.constantFrom("com", "org", "net", "in", "io", "co"),
    path: fc.array(
      fc.stringMatching(/^[a-z0-9-]+$/, { minLength: 1, maxLength: 15 }),
      { minLength: 0, maxLength: 4 }
    ),
  })
  .map(({ domain, tld, path }) => {
    const pathStr = path.length > 0 ? "/" + path.join("/") : "";
    return `https://${domain}.${tld}${pathStr}`;
  });

/** Generate a non-empty title (including unicode and special chars) */
const titleArb = fc.stringMatching(/^[^\x00-\x08\x0B\x0C\x0E-\x1F]+$/, {
  minLength: 1,
  maxLength: 200,
});

/** Generate a valid share platform */
const platformArb: fc.Arbitrary<SharePlatform> = fc.constantFrom(
  "twitter",
  "facebook",
  "linkedin"
);

// =============================================================================
// Property Tests
// =============================================================================

describe("Share URL Property Tests", () => {
  /**
   * **Validates: Requirements 5**
   *
   * Property 5: Share URLs are valid for all platforms
   * ∀ platform ∈ ["twitter", "facebook", "linkedin"]:
   *   isValidUrl(generateShareUrl(platform, validUrl, validTitle))
   *
   * For any valid article URL and non-empty title, generateShareUrl always
   * produces a valid, parseable URL regardless of platform.
   */
  describe("Property 5: Share URLs are valid for all platforms", () => {
    it("generateShareUrl always returns a valid parseable URL", () => {
      fc.assert(
        fc.property(platformArb, validUrlArb, titleArb, (platform, url, title) => {
          const shareUrl = generateShareUrl(platform, url, title);

          // The result must be parseable as a valid URL (throws if invalid)
          const parsed = new URL(shareUrl);

          // Must use HTTPS protocol
          expect(parsed.protocol).toBe("https:");

          // Must have a valid hostname
          expect(parsed.hostname.length).toBeGreaterThan(0);
        }),
        { numRuns: 200 }
      );
    });

    it("generateShareUrl includes the article URL encoded in the result", () => {
      fc.assert(
        fc.property(platformArb, validUrlArb, titleArb, (platform, url, title) => {
          const shareUrl = generateShareUrl(platform, url, title);

          // The encoded article URL should appear somewhere in the share URL
          const encodedUrl = encodeURIComponent(url);
          expect(shareUrl).toContain(encodedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it("generateShareUrl returns platform-specific base URLs", () => {
      fc.assert(
        fc.property(validUrlArb, titleArb, (url, title) => {
          const twitterUrl = generateShareUrl("twitter", url, title);
          const facebookUrl = generateShareUrl("facebook", url, title);
          const linkedinUrl = generateShareUrl("linkedin", url, title);

          expect(twitterUrl).toContain("twitter.com");
          expect(facebookUrl).toContain("facebook.com");
          expect(linkedinUrl).toContain("linkedin.com");
        }),
        { numRuns: 100 }
      );
    });
  });
});
