import { describe, expect, it } from "vitest";
import type { Matrix } from "@/entities/relation";
import { CIRCLE_RADIUS, edgeId, pathSelection, relationToGraph, vertexId } from "./relationGraph";

const chain: Matrix = [
  [0, 1, 0],
  [0, 0, 1],
  [0, 0, 0],
];

const symmetricPath: Matrix = [
  [0, 1, 0],
  [1, 0, 1],
  [0, 1, 0],
];

describe("relationToGraph", () => {
  it("makes a vertex for every element, labelled from 1", () => {
    const graph = relationToGraph(chain, "any");
    expect(graph.vertices).toHaveLength(3);
    expect(graph.vertices[0].id).toBe("v0");
    expect(graph.vertices[0].label).toBe("1");
    expect(graph.vertices[2].id).toBe("v2");
    expect(graph.vertices[2].label).toBe("3");
  });

  it("puts vertices on a circle, the first one at the top", () => {
    const graph = relationToGraph(chain, "any");
    for (const vertex of graph.vertices) {
      expect(Math.hypot(vertex.x, vertex.y)).toBeCloseTo(CIRCLE_RADIUS);
    }
    expect(graph.vertices[0].x).toBeCloseTo(0);
    expect(graph.vertices[0].y).toBeCloseTo(-CIRCLE_RADIUS);
  });

  it("makes a directed edge for every pair of the matrix", () => {
    const graph = relationToGraph(chain, "any");
    expect(graph.isDirected).toBe(true);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].id).toBe("e0-1");
    expect(graph.edges[0].source).toBe("v0");
    expect(graph.edges[0].target).toBe("v1");
    expect(graph.edges[1].id).toBe("e1-2");
  });

  it("keeps both directions as two edges when the relation is not symmetric", () => {
    const graph = relationToGraph(
      [
        [0, 1],
        [1, 0],
      ],
      "any",
    );
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].id).toBe("e0-1");
    expect(graph.edges[1].id).toBe("e1-0");
  });

  it("makes a loop", () => {
    const graph = relationToGraph(
      [
        [1, 0],
        [0, 0],
      ],
      "any",
    );
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].id).toBe("e0-0");
    expect(graph.edges[0].source).toBe(graph.edges[0].target);
  });

  it("makes an undirected graph with one edge per pair for a symmetric relation", () => {
    const graph = relationToGraph(symmetricPath, "symmetric");
    expect(graph.isDirected).toBe(false);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].id).toBe("e0-1");
    expect(graph.edges[1].id).toBe("e1-2");
  });

  it("keeps a loop of a symmetric relation once", () => {
    const graph = relationToGraph(
      [
        [1, 1],
        [1, 0],
      ],
      "symmetric",
    );
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].id).toBe("e0-0");
    expect(graph.edges[1].id).toBe("e0-1");
  });

  it("has no edges for an empty matrix", () => {
    const graph = relationToGraph(
      [
        [0, 0],
        [0, 0],
      ],
      "any",
    );
    expect(graph.vertices).toHaveLength(2);
    expect(graph.edges).toHaveLength(0);
  });
});

describe("edgeId and vertexId", () => {
  it("builds ids from numbers", () => {
    expect(vertexId(3)).toBe("v3");
    expect(edgeId(1, 3, "any")).toBe("e1-3");
    expect(edgeId(3, 1, "any")).toBe("e3-1");
  });

  it("puts the smaller number first for a symmetric relation", () => {
    expect(edgeId(3, 1, "symmetric")).toBe("e1-3");
    expect(edgeId(1, 3, "symmetric")).toBe("e1-3");
  });
});

describe("pathSelection", () => {
  it("selects vertices and edges of a path", () => {
    const selection = pathSelection([[0, 1, 3]], "any");
    expect(selection.vertexIds).toEqual(["v0", "v1", "v3"]);
    expect(selection.edgeIds).toEqual(["e0-1", "e1-3"]);
  });

  it("does not repeat parts shared by several paths", () => {
    const selection = pathSelection(
      [
        [0, 1, 3],
        [0, 2, 3],
      ],
      "any",
    );
    expect(selection.vertexIds).toEqual(["v0", "v1", "v3", "v2"]);
    expect(selection.edgeIds).toEqual(["e0-1", "e1-3", "e0-2", "e2-3"]);
  });

  it("finds the edge of a symmetric relation by the smaller number", () => {
    const selection = pathSelection([[1, 0]], "symmetric");
    expect(selection.vertexIds).toEqual(["v1", "v0"]);
    expect(selection.edgeIds).toEqual(["e0-1"]);
  });

  it("keeps the direction for a relation that is not symmetric", () => {
    const selection = pathSelection([[1, 0]], "any");
    expect(selection.edgeIds).toEqual(["e1-0"]);
  });

  it("selects a loop", () => {
    const selection = pathSelection([[0, 0]], "any");
    expect(selection.vertexIds).toEqual(["v0"]);
    expect(selection.edgeIds).toEqual(["e0-0"]);
  });

  it("selects nothing when there are no paths", () => {
    expect(pathSelection([], "any")).toEqual({ vertexIds: [], edgeIds: [] });
  });

  it("matches the ids of the graph that relationToGraph builds", () => {
    const graph = relationToGraph(symmetricPath, "symmetric");
    const selection = pathSelection([[2, 1, 0]], "symmetric");
    const graphIds = graph.edges.map((edge) => edge.id);
    for (const id of selection.edgeIds) {
      expect(graphIds).toContain(id);
    }
  });
});
