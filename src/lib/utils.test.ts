import { describe, it, expect } from "vitest";
import { generateShareUrl } from "./utils";

describe("generateShareUrl", () => {
  const testUrl = "https://vengayam.in/en/articles/test-article";
  const testTitle = "Test Article Title";

  it("generates a valid Twitter share URL", () => {
    const result = generateShareUrl("twitter", testUrl, testTitle);
    expect(result).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(testUrl)}&text=${encodeURIComponent(testTitle)}`
    );
  });

  it("generates a valid Facebook share URL", () => {
    const result = generateShareUrl("facebook", testUrl, testTitle);
    expect(result).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(testUrl)}`
    );
  });

  it("generates a valid LinkedIn share URL", () => {
    const result = generateShareUrl("linkedin", testUrl, testTitle);
    expect(result).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(testUrl)}`
    );
  });

  it("URL-encodes special characters in title and URL", () => {
    const specialUrl = "https://vengayam.in/ta/articles/some article&foo=bar";
    const specialTitle = "Title with spaces & special <chars>";
    const result = generateShareUrl("twitter", specialUrl, specialTitle);

    expect(result).toContain(encodeURIComponent(specialUrl));
    expect(result).toContain(encodeURIComponent(specialTitle));
    // The result itself should be a valid URL
    expect(() => new URL(result)).not.toThrow();
  });

  it("returns URLs that are parseable", () => {
    const platforms = ["twitter", "facebook", "linkedin"] as const;
    for (const platform of platforms) {
      const result = generateShareUrl(platform, testUrl, testTitle);
      const parsed = new URL(result);
      expect(parsed.protocol).toBe("https:");
    }
  });
});
