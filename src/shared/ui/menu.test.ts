import { describe, expect, it } from "vitest";
import { nextMenuIndex } from "./menu";

describe("menu keyboard", () => {
  it("goes to the first or the last item when nothing is focused", () => {
    expect(nextMenuIndex(-1, 1, 3)).toBe(0);
    expect(nextMenuIndex(-1, -1, 3)).toBe(2);
  });

  it("wraps around at both ends", () => {
    expect(nextMenuIndex(0, 1, 3)).toBe(1);
    expect(nextMenuIndex(2, 1, 3)).toBe(0);
    expect(nextMenuIndex(0, -1, 3)).toBe(2);
  });

  it("returns -1 for an empty menu", () => {
    expect(nextMenuIndex(-1, 1, 0)).toBe(-1);
  });
});
