import { describe, expect, it } from "vitest";
import { createStars, moveStars, seededRandom, starLinks } from "./constellation";

describe("constellation", () => {
  it("gives the same sky for the same seed", () => {
    expect(createStars(5, 100, 50, 7)).toEqual(createStars(5, 100, 50, 7));
    const random = seededRandom(3);
    const value = random();
    expect(value).toBeGreaterThan(-0.000001);
    expect(value < 1).toBe(true);
  });

  it("keeps stars inside and bounces them off the edges", () => {
    const moved = moveStars([{ x: 98, y: 10, vx: 10, vy: 0 }], 1, 100, 50);
    expect(moved[0].x).toBe(92);
    expect(moved[0].vx).toBe(-10);
    const back = moveStars([{ x: 2, y: 10, vx: -10, vy: 0 }], 1, 100, 50);
    expect(back[0].x).toBe(8);
    expect(back[0].vx).toBe(10);
  });

  it("links only close stars, closer ones stronger", () => {
    const stars = [
      { x: 0, y: 0, vx: 0, vy: 0 },
      { x: 10, y: 0, vx: 0, vy: 0 },
      { x: 90, y: 0, vx: 0, vy: 0 },
    ];
    const links = starLinks(stars, 50);
    expect(links).toEqual([{ from: 0, to: 1, strength: 0.8 }]);
  });
});
