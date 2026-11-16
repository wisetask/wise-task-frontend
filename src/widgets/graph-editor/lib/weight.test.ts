import { describe, expect, it } from "vitest";
import { parseWeight } from "./weight";

describe("weight input", () => {
  it("reads whole, negative and fractional numbers", () => {
    expect(parseWeight("5")).toBe(5);
    expect(parseWeight("-5")).toBe(-5);
    expect(parseWeight("2.5")).toBe(2.5);
    expect(parseWeight("2,5")).toBe(2.5);
    expect(parseWeight(" 7 ")).toBe(7);
  });

  it("ignores text that is not a finished number yet", () => {
    expect(parseWeight("")).toBeNull();
    expect(parseWeight("-")).toBeNull();
    expect(parseWeight("2.")).toBeNull();
    expect(parseWeight("1e3")).toBeNull();
    expect(parseWeight("abc")).toBeNull();
  });
});
