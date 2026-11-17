import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import {
  canLayout,
  circlePositions,
  gridPositions,
  LAYOUT_STEP,
  layoutGraph,
  levelPositions,
  treeLevels,
  twoParts,
} from "./layout";

function graphWith(count: number, pairs: number[][], isDirected: boolean): Graph {
  let graph = createEmptyGraph(isDirected);
  for (let i = 0; i < count; i++) {
    graph = addVertex(graph, i * 37, (i * 53) % 200);
  }
  for (const pair of pairs) {
    graph = addEdge(graph, graph.vertices[pair[0]].id, graph.vertices[pair[1]].id);
  }
  return graph;
}

function ids(graph: Graph, numbers: number[]): string[] {
  return numbers.map((number) => graph.vertices[number].id);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("graph layout", () => {
  it("puts vertices on a circle in their order, starting from the top", () => {
    const graph = graphWith(6, [], false);
    const positions = circlePositions(graph);
    const points = graph.vertices.map((vertex) => positions.get(vertex.id) || { x: 0, y: 0 });
    const center = {
      x: (points[0].x + points[3].x) / 2,
      y: (points[0].y + points[3].y) / 2,
    };
    for (const point of points) {
      expect(distance(point, center)).toBeCloseTo(distance(points[0], center));
    }
    expect(points[0].y).toBeLessThan(points[1].y);
    expect(points[0].x).toBeCloseTo(center.x);
  });

  it("puts vertices in a square grid", () => {
    const graph = graphWith(5, [], false);
    const positions = gridPositions(graph);
    const first = positions.get(graph.vertices[0].id);
    const second = positions.get(graph.vertices[1].id);
    const fourth = positions.get(graph.vertices[3].id);
    expect(second && first ? second.x - first.x : 0).toBe(LAYOUT_STEP);
    expect(fourth && first ? fourth.y - first.y : 0).toBe(LAYOUT_STEP);
    expect(fourth && first ? fourth.x : 1).toBe(first ? first.x : 0);
  });

  it("splits a tree into levels from the chosen root", () => {
    const graph = graphWith(
      5,
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
      ],
      false,
    );
    expect(treeLevels(graph, null)).toEqual([
      [ids(graph, [0]), ids(graph, [1, 2]), ids(graph, [3, 4])],
    ]);
    const fromLeaf = treeLevels(graph, graph.vertices[3].id);
    expect(fromLeaf[0][0]).toEqual(ids(graph, [3]));
    expect(fromLeaf[0].length).toBe(4);
  });

  it("starts a directed graph from a vertex without incoming edges", () => {
    const graph = graphWith(
      3,
      [
        [2, 0],
        [0, 1],
      ],
      true,
    );
    expect(treeLevels(graph, null)[0][0]).toEqual(ids(graph, [2]));
  });

  it("puts every component of the graph next to each other", () => {
    const graph = graphWith(
      4,
      [
        [0, 1],
        [2, 3],
      ],
      false,
    );
    const components = treeLevels(graph, null);
    expect(components.length).toBe(2);
    const positions = levelPositions(graph, null);
    const a = positions.get(graph.vertices[0].id);
    const c = positions.get(graph.vertices[2].id);
    expect(a && c ? c.x - a.x : 0).toBe(LAYOUT_STEP);
    expect(a && c ? a.y : 1).toBe(c ? c.y : 0);
  });

  it("puts each level one step lower than the previous", () => {
    const graph = graphWith(
      3,
      [
        [0, 1],
        [1, 2],
      ],
      false,
    );
    const positions = levelPositions(graph, null);
    const top = positions.get(graph.vertices[0].id);
    const bottom = positions.get(graph.vertices[2].id);
    expect(top && bottom ? bottom.y - top.y : 0).toBe(2 * LAYOUT_STEP);
  });

  it("finds the two parts of a bipartite graph", () => {
    const square = graphWith(
      4,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ],
      false,
    );
    expect(twoParts(square)).toEqual([ids(square, [0, 2]), ids(square, [1, 3])]);
    const triangle = graphWith(
      3,
      [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
      false,
    );
    expect(twoParts(triangle)).toBeNull();
    const withLoop = graphWith(2, [[0, 0]], false);
    expect(twoParts(withLoop)).toBeNull();
  });

  it("says which layouts can be used", () => {
    const triangle = graphWith(
      3,
      [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
      false,
    );
    expect(canLayout(triangle, "circle")).toBe(true);
    expect(canLayout(triangle, "bipartite")).toBe(false);
    expect(canLayout(graphWith(1, [], false), "grid")).toBe(false);
  });

  it("moves only the vertices and keeps everything else", () => {
    const graph = graphWith(
      4,
      [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
      true,
    );
    const placed = layoutGraph(graph, "bipartite", null);
    expect(placed.edges).toBe(graph.edges);
    expect(placed.isDirected).toBe(true);
    expect(placed.vertices.map((vertex) => vertex.label)).toEqual(["1", "2", "3", "4"]);
    expect(placed.vertices[0].x).toBe(placed.vertices[2].x);
    expect(placed.vertices[1].x).toBe(placed.vertices[3].x);
    expect(Number.isInteger(placed.vertices[1].y)).toBe(true);
  });

  it("leaves the graph alone when the layout does not fit it", () => {
    const triangle = graphWith(
      3,
      [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
      false,
    );
    expect(layoutGraph(triangle, "bipartite", null)).toBe(triangle);
  });
});
