import { describe, expect, it } from "vitest";
import { initialTheme, nextTheme, parseTheme, toggleTitle } from "./theme";

describe("theme", () => {
  it("accepts only known themes", () => {
    expect(parseTheme("day")).toBe("day");
    expect(parseTheme("night")).toBe("night");
    expect(parseTheme("dark")).toBeNull();
    expect(parseTheme(null)).toBeNull();
    expect(parseTheme(undefined)).toBeNull();
  });

  it("prefers the saved theme over the system one", () => {
    expect(initialTheme("day", true)).toBe("day");
    expect(initialTheme("night", false)).toBe("night");
  });

  it("follows the system when nothing is saved", () => {
    expect(initialTheme(null, true)).toBe("night");
    expect(initialTheme("что-то", false)).toBe("day");
  });

  it("switches between day and night", () => {
    expect(nextTheme("day")).toBe("night");
    expect(nextTheme("night")).toBe("day");
    expect(toggleTitle("day")).toBe("Включить ночную тему");
    expect(toggleTitle("night")).toBe("Включить дневную тему");
  });
});
