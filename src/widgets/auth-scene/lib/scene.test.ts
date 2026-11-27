import { describe, expect, it } from "vitest";
import {
  buildNodes,
  createRandom,
  driftOffset,
  litCount,
  litOrder,
  nearestEdges,
  approach,
  nearestNode,
  repelOffset,
} from "./scene";

describe("auth scene", () => {
  it("builds the same spread-out nodes for the same seed", () => {
    const nodes = buildNodes(16, 7);
    expect(nodes.length).toBe(16);
    expect(buildNodes(16, 7)).toEqual(nodes);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const gap = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        expect(gap >= 119).toBe(true);
      }
    }
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it("links every node to its nearest neighbours without repeats", () => {
    const nodes = buildNodes(10, 3);
    const edges = nearestEdges(nodes, 2);
    const keys = edges.map(
      (edge) => Math.min(edge.from, edge.to) + "-" + Math.max(edge.from, edge.to),
    );
    expect(new Set(keys).size).toBe(edges.length);
    expect(edges.length >= 10).toBe(true);
  });

  it("lights nodes outward from the start and covers everything", () => {
    const nodes = buildNodes(12, 5);
    const order = litOrder(nodes, nearestEdges(nodes, 2), 0);
    expect(order[0]).toBe(0);
    expect(new Set(order).size).toBe(12);
    expect(litCount(0, 12)).toBe(0);
    expect(litCount(0.01, 12)).toBe(1);
    expect(litCount(0.5, 12)).toBe(6);
    expect(litCount(1, 12)).toBe(12);
  });

  it("drifts a little and moves away from the pointer", () => {
    const node = { id: 0, x: 500, y: 500, phase: 0, speed: 1 };
    const drift = driftOffset(node, 1.3);
    expect(Math.abs(drift.x) <= 16).toBe(true);
    expect(repelOffset(node, null)).toEqual({ x: 0, y: 0 });
    expect(repelOffset(node, { x: 900, y: 500 })).toEqual({ x: 0, y: 0 });
    const push = repelOffset(node, { x: 450, y: 500 });
    expect(push.x > 0).toBe(true);
    expect(push.y).toBe(0);
    expect(nearestNode([node, { x: 100, y: 100 }], { x: 110, y: 90 }, 60)).toBe(1);
    expect(nearestNode([node], { x: 0, y: 0 }, 60)).toBe(-1);
  });

  it("weakens the push while the pointer fades in or out", () => {
    const node = { x: 500, y: 500 };
    const full = repelOffset(node, { x: 450, y: 500 });
    const half = repelOffset(node, { x: 450, y: 500 }, 0.5);
    expect(half.x).toBeCloseTo(full.x / 2);
    expect(repelOffset(node, { x: 450, y: 500 }, 0)).toEqual({ x: 0, y: 0 });
  });

  it("approaches the target smoothly and never overshoots", () => {
    expect(approach(0, 100, 8, 0)).toBe(0);
    const step = approach(0, 100, 8, 1 / 60);
    expect(step > 0 && step < 100).toBe(true);
    expect(approach(0, 100, 8, 10)).toBeCloseTo(100);
  });
});
