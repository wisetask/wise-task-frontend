import { describe, expect, it } from "vitest";
import { READONLY_HINT, toolHint } from "./toolHints";

describe("tool hints", () => {
  it("explains the current tool", () => {
    expect(toolHint("edge", false)).toContain("петля");
    expect(toolHint("pan", false)).toContain("двигать холст");
  });

  it("says the graph cannot be changed in view-only mode", () => {
    expect(toolHint("vertex", true)).toBe(READONLY_HINT);
  });
});
