import { describe, expect, it } from "vitest";
import { boxFrame, canExpand, TITLE_LEFT, TITLE_TOP, titleFrames } from "./expandGhost";

describe("expand ghost", () => {
  it("turns a box into a keyframe", () => {
    expect(boxFrame({ left: 10.4, top: 20.6, width: 300, height: 80 }, 14)).toEqual({
      left: "10px",
      top: "21px",
      width: "300px",
      height: "80px",
      borderRadius: "14px",
    });
  });

  it("moves the title to the place of the task name", () => {
    const frames = titleFrames(
      { left: 400, top: 300, width: 800, height: 100 },
      { left: 0, top: 50, width: 1800, height: 900 },
    );
    expect(frames[0]).toEqual({ transform: "translate(0px, 0px)" });
    const x = TITLE_LEFT - 400 - 20;
    const y = 50 + TITLE_TOP - 300 - 16;
    expect(frames[1]).toEqual({ transform: "translate(" + x + "px, " + y + "px) scale(1.15)" });
  });

  it("does not play when the link opens in a new tab", () => {
    expect(
      canExpand({
        button: 0,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      } as MouseEvent),
    ).toBe(true);
    expect(
      canExpand({
        button: 0,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      } as MouseEvent),
    ).toBe(false);
    expect(
      canExpand({
        button: 1,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      } as MouseEvent),
    ).toBe(false);
  });
});
