import { describe, expect, it } from "vitest";
import { zoomKeyAction } from "./zoomKeys";

describe("zoom hotkeys", () => {
  it("zooms with plus and minus, also on the numpad", () => {
    expect(zoomKeyAction("Equal", false)).toBe("zoom-in");
    expect(zoomKeyAction("Equal", true)).toBe("zoom-in");
    expect(zoomKeyAction("NumpadAdd", false)).toBe("zoom-in");
    expect(zoomKeyAction("Minus", false)).toBe("zoom-out");
    expect(zoomKeyAction("NumpadSubtract", false)).toBe("zoom-out");
  });

  it("goes back to 100% with zero", () => {
    expect(zoomKeyAction("Digit0", false)).toBe("reset");
    expect(zoomKeyAction("Numpad0", false)).toBe("reset");
    expect(zoomKeyAction("Digit0", true)).toBeNull();
  });

  it("shows the whole graph with Shift+1", () => {
    expect(zoomKeyAction("Digit1", true)).toBe("fit");
  });

  it("leaves the tool keys alone", () => {
    expect(zoomKeyAction("Digit1", false)).toBeNull();
    expect(zoomKeyAction("Digit2", false)).toBeNull();
    expect(zoomKeyAction("KeyZ", false)).toBeNull();
  });
});
