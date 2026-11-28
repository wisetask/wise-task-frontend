import { describe, expect, it } from "vitest";
import { passwordStrength } from "./passwordStrength";

describe("passwordStrength", () => {
  it("rates passwords from short to great", () => {
    expect(passwordStrength("").level).toBe(0);
    expect(passwordStrength("ab").title).toBe("Слишком короткий");
    expect(passwordStrength("abcdef").title).toBe("Слабый");
    expect(passwordStrength("graph2026").title).toBe("Хороший");
    expect(passwordStrength("Graph2026Euler").title).toBe("Отличный");
    expect(passwordStrength("граф-2026-эйлер").level).toBe(4);
  });
});
