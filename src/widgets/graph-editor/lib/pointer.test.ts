import { describe, expect, it } from "vitest";
import { clamp } from "./pointer";

describe("canvas pointer helpers", () => {
  it("keeps a value between the borders", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});
