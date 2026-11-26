import { describe, expect, it } from "vitest";
import { isMotionOff, motionAllowed, parseMotionOff, setMotionOff } from "./motion";

describe("motion", () => {
  it("reads the stored value", () => {
    expect(parseMotionOff("off")).toBe(true);
    expect(parseMotionOff("on")).toBe(false);
    expect(parseMotionOff(null)).toBe(false);
  });

  it("turns animations off for the whole page", () => {
    setMotionOff(true);
    expect(isMotionOff()).toBe(true);
    expect(motionAllowed()).toBe(false);
    expect(document.documentElement.dataset.motion).toBe("off");
    setMotionOff(false);
    expect(isMotionOff()).toBe(false);
    expect(document.documentElement.dataset.motion).toBe("on");
  });
});
