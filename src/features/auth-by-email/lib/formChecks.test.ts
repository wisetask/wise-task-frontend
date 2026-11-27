import { describe, expect, it } from "vitest";
import { filledShare, looksLikeEmail, passwordStrength } from "./formChecks";

describe("formChecks", () => {
  it("recognises something that looks like an email", () => {
    expect(looksLikeEmail("student@etu.ru")).toBe(true);
    expect(looksLikeEmail("  student@etu.ru ")).toBe(true);
    expect(looksLikeEmail("student@etu")).toBe(false);
    expect(looksLikeEmail("student etu.ru")).toBe(false);
  });

  it("rates passwords from short to great", () => {
    expect(passwordStrength("").level).toBe(0);
    expect(passwordStrength("ab").title).toBe("Слишком короткий");
    expect(passwordStrength("abcdef").title).toBe("Слабый");
    expect(passwordStrength("graph2026").title).toBe("Хороший");
    expect(passwordStrength("Graph2026Euler").title).toBe("Отличный");
    expect(passwordStrength("граф-2026-эйлер").level).toBe(4);
  });

  it("counts the filled share of the form", () => {
    expect(filledShare([true, false, true, true])).toBe(0.75);
    expect(filledShare([])).toBe(0);
  });
});
