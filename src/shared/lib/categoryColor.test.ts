import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS, categoryColor } from "./categoryColor";

describe("category colour", () => {
  it("is the same for the same category", () => {
    expect(categoryColor("Деревья")).toBe(categoryColor(" деревья "));
    expect(categoryColor("Деревья")).toBeLessThan(CATEGORY_COLORS);
    expect(categoryColor("")).toBe(0);
  });
});
