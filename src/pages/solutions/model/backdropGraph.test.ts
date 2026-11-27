import { describe, expect, it } from "vitest";
import {
  BACKDROP_COLUMNS,
  BACKDROP_HEIGHT,
  BACKDROP_ROWS,
  BACKDROP_WIDTH,
  backdropPoints,
  breadthFirst,
  farthestNode,
  nearestEdges,
  pathLine,
  pathTo,
} from "./backdropGraph";

describe("backdrop graph", () => {
  it("spreads the vertices over the whole screen the same way every time", () => {
    const points = backdropPoints(7);
    expect(points.length).toBe(BACKDROP_COLUMNS * BACKDROP_ROWS);
    expect(backdropPoints(7)).toEqual(points);
    for (const point of points) {
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(BACKDROP_WIDTH);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(BACKDROP_HEIGHT);
    }
  });

  it("links each vertex to its nearest neighbours once", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 100, y: 0 },
    ];
    expect(nearestEdges(points, 1)).toEqual([
      [0, 1],
      [1, 2],
    ]);
  });

  it("finds layers and the shortest path by breadth-first search", () => {
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [4, 3],
    ];
    const result = breadthFirst(6, edges, 0);
    expect(result.layer).toEqual([0, 1, 2, 2, 1, -1]);
    const far = farthestNode(result.layer);
    expect(far).toBe(2);
    expect(pathTo(result.parent, 3)).toEqual([0, 4, 3]);
    expect(pathTo(result.parent, 0)).toEqual([0]);
  });

  it("draws the path as a polyline", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ];
    expect(pathLine(points, [0, 1, 2])).toBe("M0 0 L10 5 L20 0");
  });
});
