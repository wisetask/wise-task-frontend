import { describe, expect, it } from "vitest";
import {
  colorsText,
  greedyColoring,
  isProperColoring,
  latticeEdges,
  latticePoints,
  nearestPoint,
  neighbourLists,
  PAINT_HEIGHT,
  PAINT_WIDTH,
  paintOrder,
} from "./coloringBackdrop";

describe("coloring backdrop", () => {
  it("places the same lattice for the same seed inside the picture", () => {
    const points = latticePoints(7);
    expect(points).toEqual(latticePoints(7));
    expect(points.length).toBe(60);
    for (const point of points) {
      expect(point.x).toBeGreaterThan(-1);
      expect(point.x).toBeLessThan(PAINT_WIDTH + 1);
      expect(point.y).toBeGreaterThan(-1);
      expect(point.y).toBeLessThan(PAINT_HEIGHT + 1);
    }
  });

  it("links close vertices into a connected mesh", () => {
    const points = latticePoints(7);
    const neighbours = neighbourLists(points.length, latticeEdges(points));
    const order = paintOrder(neighbours, 0);
    expect(order.length).toBe(points.length);
    expect(new Set(order).size).toBe(points.length);
    for (const list of neighbours) {
      expect(list.length).toBeGreaterThan(0);
    }
  });

  it("paints neighbours in different colors", () => {
    const points = latticePoints(11);
    const neighbours = neighbourLists(points.length, latticeEdges(points));
    const coloring = greedyColoring(neighbours, paintOrder(neighbours, 25));
    expect(isProperColoring(neighbours, coloring.colors)).toBe(true);
    expect(coloring.used).toBeGreaterThan(2);
    expect(coloring.clashes[25]).toBe(0);
  });

  it("colors a triangle with three colors and counts the tries", () => {
    const neighbours = [
      [1, 2],
      [0, 2],
      [0, 1],
    ];
    const coloring = greedyColoring(neighbours, [0, 1, 2]);
    expect(coloring.colors).toEqual([0, 1, 2]);
    expect(coloring.clashes).toEqual([0, 1, 2]);
    expect(coloring.used).toBe(3);
  });

  it("finds the vertex under the pointer", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    expect(nearestPoint(points, 90, 5, 40)).toBe(1);
    expect(nearestPoint(points, 50, 300, 40)).toBe(-1);
  });

  it("writes the number of colors", () => {
    expect(colorsText(1)).toBe("1 цвет");
    expect(colorsText(3)).toBe("3 цвета");
    expect(colorsText(5)).toBe("5 цветов");
  });
});
