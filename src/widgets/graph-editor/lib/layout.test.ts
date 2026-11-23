import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import { canLayout, gridPositions, LAYOUT_STEP, layoutGraph } from "./layout";

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

describe("graph layout", () => {
  it.each(["auto", "circle", "grid", "levels", "bipartite"] as const)(
    "preserves the graph data and center and rounds coordinates for %s",
    (kind) => {
      const graph = graphWith(
        4,
        [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
        true,
      );
      const placed = layoutGraph(graph, kind, null);
      expect(placed.vertices).not.toEqual(graph.vertices);
      expect({
        ...placed,
        vertices: placed.vertices.map((vertex, index) => ({
          ...vertex,
          x: graph.vertices[index].x,
          y: graph.vertices[index].y,
        })),
      }).toEqual(graph);
      for (const axis of ["x", "y"] as const) {
        const before = graph.vertices.map((vertex) => vertex[axis]);
        const after = placed.vertices.map((vertex) => vertex[axis]);
        const beforeCenter = (Math.min(...before) + Math.max(...before)) / 2;
        const afterCenter = (Math.min(...after) + Math.max(...after)) / 2;
        expect(Math.abs(afterCenter - beforeCenter)).toBeLessThanOrEqual(1);
        expect(after.every(Number.isInteger)).toBe(true);
      }
    },
  );

  it("places the chosen root above the other vertices", () => {
    const graph = graphWith(
      4,
      [
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      false,
    );
    const { vertices } = layoutGraph(graph, "levels", graph.vertices[3].id);
    expect(vertices.slice(0, 3).every((vertex) => vertex.y > vertices[3].y)).toBe(true);
  });

  it("starts directed levels at the vertex without incoming edges", () => {
    const graph = graphWith(
      4,
      [
        [0, 1],
        [1, 2],
        [1, 3],
      ],
      true,
    );
    const { vertices } = layoutGraph(graph, "levels", null);
    expect(vertices[0].y).toBeLessThan(vertices[1].y);
    expect(vertices[1].y).toBeLessThan(vertices[2].y);
    expect(vertices[2].y).toBe(vertices[3].y);
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
