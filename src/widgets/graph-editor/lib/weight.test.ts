import { describe, expect, it } from "vitest";
import { parseWeight, weightError } from "./weight";

describe("weight input", () => {
  it("reads whole and negative numbers", () => {
    expect(parseWeight("5")).toBe(5);
    expect(parseWeight("-5")).toBe(-5);
    expect(parseWeight("0")).toBe(0);
    expect(parseWeight(" 7 ")).toBe(7);
  });

  it("does not accept fractions because the backend keeps whole numbers", () => {
    expect(parseWeight("2.5")).toBeNull();
    expect(parseWeight("2,5")).toBeNull();
    expect(weightError("2,5")).not.toBe("");
  });

  it("ignores text that is not a number", () => {
    expect(parseWeight("")).toBeNull();
    expect(parseWeight("-")).toBeNull();
    expect(parseWeight("1e3")).toBeNull();
    expect(parseWeight("abc")).toBeNull();
  });

  it("does not complain while the number is still being typed", () => {
    expect(weightError("")).toBe("");
    expect(weightError("-")).toBe("");
    expect(weightError("-3")).toBe("");
    expect(weightError("abc")).toBe("Нужно целое число, например 3 или -2");
  });
});
