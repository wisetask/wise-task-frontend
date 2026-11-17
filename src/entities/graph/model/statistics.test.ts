import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "./operations";
import {
  countComponents,
  countEdges,
  countIsolated,
  countLeaves,
  countLoops,
  countVertices,
  graphStatistics,
  vertexDegree,
} from "./statistics";
import type { Graph } from "./types";

// Строит граф из vertexCount вершин; рёбра заданы парами номеров вершин (с нуля).
function buildGraph(vertexCount: number, pairs: number[][], isDirected = false): Graph {
  let graph = createEmptyGraph(isDirected);
  for (let i = 0; i < vertexCount; i++) {
    graph = addVertex(graph, i * 10, 0);
  }
  for (const pair of pairs) {
    graph = addEdge(graph, graph.vertices[pair[0]].id, graph.vertices[pair[1]].id);
  }
  return graph;
}

// Обычный граф: путь 1-2-3 и отдельная вершина 4
function ordinaryGraph(): Graph {
  return buildGraph(4, [
    [0, 1],
    [1, 2],
  ]);
}

// Вершина 1 с петлёй, соединена с вершиной 2
function loopGraph(): Graph {
  return buildGraph(2, [
    [0, 0],
    [0, 1],
  ]);
}

// Дерево с макета: 7 вершин, 6 рёбер, листья 3, 5, 6, 7
function treeGraph(): Graph {
  return buildGraph(7, [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [1, 5],
    [3, 6],
  ]);
}

describe("countVertices", () => {
  it("counts vertices of an ordinary graph", () => {
    expect(countVertices(ordinaryGraph())).toBe(4);
  });

  it("returns 0 for an empty graph", () => {
    expect(countVertices(createEmptyGraph(false))).toBe(0);
  });

  it("counts vertices of a graph with a loop", () => {
    expect(countVertices(loopGraph())).toBe(2);
  });
});

describe("countEdges", () => {
  it("counts edges of an ordinary graph", () => {
    expect(countEdges(ordinaryGraph())).toBe(2);
  });

  it("returns 0 for an empty graph", () => {
    expect(countEdges(createEmptyGraph(false))).toBe(0);
  });

  it("counts a loop as an edge", () => {
    expect(countEdges(loopGraph())).toBe(2);
  });
});

describe("vertexDegree", () => {
  it("returns degrees in an ordinary graph", () => {
    const graph = ordinaryGraph();
    expect(vertexDegree(graph, graph.vertices[0].id)).toBe(1);
    expect(vertexDegree(graph, graph.vertices[1].id)).toBe(2);
    expect(vertexDegree(graph, graph.vertices[3].id)).toBe(0);
  });

  it("returns 0 when the graph is empty", () => {
    expect(vertexDegree(createEmptyGraph(false), "missing")).toBe(0);
  });

  it("adds 2 to the degree for a loop", () => {
    const graph = loopGraph();
    expect(vertexDegree(graph, graph.vertices[0].id)).toBe(3);
    expect(vertexDegree(graph, graph.vertices[1].id)).toBe(1);
  });

  it("counts incoming and outgoing edges in a directed graph", () => {
    const graph = buildGraph(2, [[0, 1]], true);
    expect(vertexDegree(graph, graph.vertices[0].id)).toBe(1);
    expect(vertexDegree(graph, graph.vertices[1].id)).toBe(1);
  });
});

describe("countLoops", () => {
  it("returns 0 for an ordinary graph", () => {
    expect(countLoops(ordinaryGraph())).toBe(0);
  });

  it("returns 0 for an empty graph", () => {
    expect(countLoops(createEmptyGraph(false))).toBe(0);
  });

  it("counts a loop", () => {
    expect(countLoops(loopGraph())).toBe(1);
  });
});

describe("countLeaves", () => {
  it("counts leaves of an ordinary graph", () => {
    expect(countLeaves(ordinaryGraph())).toBe(2);
  });

  it("returns 0 for an empty graph", () => {
    expect(countLeaves(createEmptyGraph(false))).toBe(0);
  });

  it("does not count a vertex with a loop as a leaf", () => {
    // у вершины 1 степень 3, лист только вершина 2
    expect(countLeaves(loopGraph())).toBe(1);
  });

  it("does not count vertices of a graph without edges as leaves", () => {
    expect(countLeaves(buildGraph(3, []))).toBe(0);
  });

  it("does not count a vertex that has only a loop (degree 2)", () => {
    expect(countLeaves(buildGraph(1, [[0, 0]]))).toBe(0);
  });
});

describe("countIsolated", () => {
  it("counts isolated vertices of an ordinary graph", () => {
    expect(countIsolated(ordinaryGraph())).toBe(1);
  });

  it("returns 0 for an empty graph", () => {
    expect(countIsolated(createEmptyGraph(false))).toBe(0);
  });

  it("returns 0 when every vertex has an edge, even with a loop", () => {
    expect(countIsolated(loopGraph())).toBe(0);
  });

  it("treats all vertices as isolated when there are no edges", () => {
    expect(countIsolated(buildGraph(3, []))).toBe(3);
  });
});

describe("countComponents", () => {
  it("counts components of an ordinary graph", () => {
    expect(countComponents(ordinaryGraph())).toBe(2);
  });

  it("returns 0 for an empty graph", () => {
    expect(countComponents(createEmptyGraph(false))).toBe(0);
  });

  it("returns 1 for a connected graph with a loop", () => {
    expect(countComponents(loopGraph())).toBe(1);
  });

  it("makes a separate component of a vertex that has only a loop", () => {
    expect(countComponents(buildGraph(2, [[0, 0]]))).toBe(2);
  });

  it("ignores the direction of edges", () => {
    const graph = buildGraph(
      3,
      [
        [0, 1],
        [2, 1],
      ],
      true,
    );
    expect(countComponents(graph)).toBe(1);
  });
});

describe("graphStatistics", () => {
  it("collects numbers for an ordinary graph", () => {
    expect(graphStatistics(ordinaryGraph())).toEqual({
      vertices: 4,
      edges: 2,
      loops: 0,
      leaves: 2,
      isolated: 1,
      components: 2,
    });
  });

  it("returns zeros for an empty graph", () => {
    expect(graphStatistics(createEmptyGraph(false))).toEqual({
      vertices: 0,
      edges: 0,
      loops: 0,
      leaves: 0,
      isolated: 0,
      components: 0,
    });
  });

  it("collects numbers for a graph with a loop", () => {
    expect(graphStatistics(loopGraph())).toEqual({
      vertices: 2,
      edges: 2,
      loops: 1,
      leaves: 1,
      isolated: 0,
      components: 1,
    });
  });

  it("gives 4 leaves and 1 component for the tree from the mockup", () => {
    const stats = graphStatistics(treeGraph());
    expect(stats.vertices).toBe(7);
    expect(stats.edges).toBe(6);
    expect(stats.leaves).toBe(4);
    expect(stats.components).toBe(1);
  });
});
