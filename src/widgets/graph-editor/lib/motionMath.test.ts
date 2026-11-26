import { describe, expect, it } from "vitest";
import { addVertex, createEmptyGraph, moveVertex } from "@/entities/graph";
import {
  blendGraph,
  blendViewport,
  easeInOutCubic,
  easeOutCubic,
  fallGraph,
  orbitGraph,
  sharesMostVertices,
} from "./motionMath";

describe("motionMath", () => {
  it("eases from 0 to 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("blends the viewport", () => {
    const view = blendViewport({ x: 0, y: 0, scale: 1 }, { x: 100, y: -50, scale: 2 }, 0.5);
    expect(view).toEqual({ x: 50, y: -25, scale: 1.5 });
  });

  it("moves vertices halfway and leaves new ones in place", () => {
    let from = createEmptyGraph(false);
    from = addVertex(from, 0, 0);
    let to = moveVertex(from, from.vertices[0].id, 100, 40);
    to = addVertex(to, 300, 300);
    const half = blendGraph(from, to, 0.5);
    expect(half.vertices[0].x).toBe(50);
    expect(half.vertices[0].y).toBe(20);
    expect(half.vertices[1].x).toBe(300);
    expect(half.edges).toBe(to.edges);
  });

  it("turns leaves around the centre", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    const turned = orbitGraph(graph, graph.vertices[0].id, [graph.vertices[1].id], Math.PI / 2);
    expect(Math.round(turned.vertices[1].x)).toBe(0);
    expect(Math.round(turned.vertices[1].y)).toBe(100);
    expect(turned.vertices[0]).toBe(graph.vertices[0]);
  });

  it("drops vertices down", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    expect(fallGraph(graph, 0, 400).vertices[0].y).toBe(0);
    expect(fallGraph(graph, 1, 400).vertices[0].y).toBe(400);
  });

  it("tells a small edit from a whole new graph", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    let other = createEmptyGraph(false);
    other = addVertex(other, 0, 0);
    expect(sharesMostVertices(graph, addVertex(graph, 100, 0))).toBe(true);
    expect(sharesMostVertices(graph, other)).toBe(false);
    expect(sharesMostVertices(createEmptyGraph(false), createEmptyGraph(true))).toBe(true);
  });
});
