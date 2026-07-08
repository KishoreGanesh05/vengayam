import { describe, it, expect } from "vitest";

describe("project setup", () => {
  it("vitest is configured correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("fast-check is available", async () => {
    const fc = await import("fast-check");
    expect(fc).toBeDefined();
    expect(fc.integer).toBeDefined();
  });
});
