import { describe, expect, it } from "vitest";
import { cloudPoints, primTree, treeWeight, type TreePoint } from "./primTree";

describe("cloudPoints", () => {
  it("gives the same cloud for the same seed", () => {
    expect(cloudPoints(20, 7, 120)).toEqual(cloudPoints(20, 7, 120));
  });

  it("keeps points apart", () => {
    const points = cloudPoints(20, 7, 120);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const gap = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        expect(gap >= 120).toBe(true);
      }
    }
  });
});

describe("primTree", () => {
  it("connects every point with n - 1 edges and no cycles", () => {
    const points = cloudPoints(25, 3, 100);
    const edges = primTree(points, 0);
    expect(edges.length).toBe(points.length - 1);

    // Каждое ребро подключает новую вершину: значит, циклов нет и все вершины в дереве.
    const reached = new Set<number>([0]);
    for (const edge of edges) {
      expect(reached.has(edge.from)).toBe(true);
      expect(reached.has(edge.to)).toBe(false);
      reached.add(edge.to);
    }
    expect(reached.size).toBe(points.length);
  });

  it("picks the shortest edges", () => {
    // Четыре точки в ряд: минимальное дерево — три соседних отрезка, а не прыжки через точку.
    const points: TreePoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 30, y: 0 },
    ];
    const edges = primTree(points, 0);
    expect(treeWeight(points, edges)).toBe(30);
  });

  it("returns no edges for an empty cloud", () => {
    expect(primTree([], 0)).toEqual([]);
  });
});
