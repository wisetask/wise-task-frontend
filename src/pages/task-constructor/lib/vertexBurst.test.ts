import { describe, expect, it } from "vitest";
import { burstPoints } from "./vertexBurst";

describe("vertex burst", () => {
  it("spreads the vertices around the button", () => {
    const points = burstPoints(8, 100);
    expect(points.length).toBe(8);
    for (const point of points) {
      const distance = Math.hypot(point[0], point[1]);
      expect(distance).toBeGreaterThan(65);
      expect(distance).toBeLessThan(101);
    }
  });
});
