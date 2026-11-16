import { describe, expect, it } from "vitest";
import { colorClass, edgeArrow } from "./colors";

describe("graph colors", () => {
  it("turns a graph color into a css class part", () => {
    expect(colorClass("RED")).toBe("red");
    expect(colorClass("GRAY")).toBe("gray");
  });

  it("picks an arrow of the edge color or the selection color", () => {
    expect(edgeArrow("GREEN", false)).toBe("url(#graph-arrow-green)");
    expect(edgeArrow("GREEN", true)).toBe("url(#graph-arrow-selected)");
  });
});
