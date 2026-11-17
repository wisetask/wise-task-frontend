import { describe, expect, it } from "vitest";
import { clamp, wantsToggle } from "./pointer";

describe("canvas pointer helpers", () => {
  it("keeps a value between the borders", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("adds to the selection with Shift, Ctrl or Cmd", () => {
    expect(wantsToggle({ shiftKey: false, ctrlKey: false, metaKey: false })).toBe(false);
    expect(wantsToggle({ shiftKey: true, ctrlKey: false, metaKey: false })).toBe(true);
    expect(wantsToggle({ shiftKey: false, ctrlKey: true, metaKey: false })).toBe(true);
    expect(wantsToggle({ shiftKey: false, ctrlKey: false, metaKey: true })).toBe(true);
  });
});
