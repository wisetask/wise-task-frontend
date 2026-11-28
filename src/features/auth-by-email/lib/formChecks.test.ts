import { describe, expect, it } from "vitest";
import { filledShare, looksLikeEmail } from "./formChecks";

describe("formChecks", () => {
  it("recognises something that looks like an email", () => {
    expect(looksLikeEmail("student@etu.ru")).toBe(true);
    expect(looksLikeEmail("  student@etu.ru ")).toBe(true);
    expect(looksLikeEmail("student@etu")).toBe(false);
    expect(looksLikeEmail("student etu.ru")).toBe(false);
  });

  it("counts the filled share of the form", () => {
    expect(filledShare([true, false, true, true])).toBe(0.75);
    expect(filledShare([])).toBe(0);
  });
});
