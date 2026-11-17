import { describe, expect, it } from "vitest";
import {
  addEdge,
  addVertex,
  createEmptyGraph,
  findEdge,
  hasEdge,
  moveVertex,
  moveVertices,
  nextVertexLabel,
  removeEdge,
  removeVertex,
  setDirected,
  updateEdge,
  updateVertex,
} from "./operations";

describe("graph operations", () => {
  it("numbers new vertices one after another", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 10);
    expect(graph.vertices[0].label).toBe("1");
    expect(graph.vertices[1].label).toBe("2");
    expect(nextVertexLabel(graph)).toBe("3");
  });

  it("does not change the original graph", () => {
    const graph = createEmptyGraph(false);
    addVertex(graph, 0, 0);
    expect(graph.vertices.length).toBe(0);
  });

  it("moves only the chosen vertex", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 5, 5);
    graph = moveVertex(graph, graph.vertices[0].id, 100, 200);
    expect(graph.vertices[0].x).toBe(100);
    expect(graph.vertices[0].y).toBe(200);
    expect(graph.vertices[1].x).toBe(5);
  });

  it("moves several vertices by the same distance", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 20);
    graph = addVertex(graph, 50, 50);
    const moved = moveVertices(graph, [graph.vertices[0].id, graph.vertices[1].id], 5, -10);
    expect(moved.vertices[0].x).toBe(5);
    expect(moved.vertices[0].y).toBe(-10);
    expect(moved.vertices[1].x).toBe(15);
    expect(moved.vertices[1].y).toBe(10);
    expect(moved.vertices[2]).toBe(graph.vertices[2]);
  });

  it("removes edges together with their vertex", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 0);
    graph = addVertex(graph, 20, 0);
    const a = graph.vertices[0].id;
    const b = graph.vertices[1].id;
    const c = graph.vertices[2].id;
    graph = addEdge(graph, a, b);
    graph = addEdge(graph, b, c);
    graph = removeVertex(graph, b);
    expect(graph.vertices.length).toBe(2);
    expect(graph.edges.length).toBe(0);
  });

  it("treats a-b and b-a as one edge in an undirected graph", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 0);
    const a = graph.vertices[0].id;
    const b = graph.vertices[1].id;
    graph = addEdge(graph, a, b);
    graph = addEdge(graph, b, a);
    expect(graph.edges.length).toBe(1);
    expect(hasEdge(graph, b, a)).toBe(true);
  });

  it("keeps a-b and b-a apart in a directed graph", () => {
    let graph = createEmptyGraph(true);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 0);
    const a = graph.vertices[0].id;
    const b = graph.vertices[1].id;
    graph = addEdge(graph, a, b);
    graph = addEdge(graph, b, a);
    expect(graph.edges.length).toBe(2);
  });

  it("allows a loop", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    const a = graph.vertices[0].id;
    graph = addEdge(graph, a, a);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].source).toBe(graph.edges[0].target);
  });

  it("ignores an edge to a missing vertex", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addEdge(graph, graph.vertices[0].id, "missing");
    expect(graph.edges.length).toBe(0);
  });

  it("removes one edge by id", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    graph = removeEdge(graph, graph.edges[0].id);
    expect(graph.edges.length).toBe(0);
  });

  it("keeps both directions when the graph becomes directed", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 10);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    graph = setDirected(graph, true);
    expect(graph.isDirected).toBe(true);
    expect(graph.edges.length).toBe(1);
  });

  it("drops a reverse duplicate when the graph becomes undirected", () => {
    let graph = createEmptyGraph(true);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 10);
    const a = graph.vertices[0].id;
    const b = graph.vertices[1].id;
    graph = addEdge(graph, a, b);
    graph = addEdge(graph, b, a);
    graph = addEdge(graph, a, a);
    graph = setDirected(graph, false);
    expect(graph.isDirected).toBe(false);
    expect(graph.edges.length).toBe(2);
    expect(graph.edges[0].source).toBe(a);
    expect(graph.edges[1].source).toBe(a);
    expect(graph.edges[1].target).toBe(a);
  });

  it("finds an edge by id", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 10);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const edgeId = graph.edges[0].id;
    expect(findEdge(graph, edgeId)).toBe(graph.edges[0]);
    expect(findEdge(graph, "missing")).toBeUndefined();
  });

  it("changes only the given fields of a vertex", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 5, 7);
    const before = graph;
    graph = updateVertex(graph, graph.vertices[0].id, { label: "A", color: "RED" });
    expect(graph.vertices[0].label).toBe("A");
    expect(graph.vertices[0].color).toBe("RED");
    expect(graph.vertices[0].weight).toBe(0);
    expect(graph.vertices[0].x).toBe(5);
    expect(before.vertices[0].label).toBe("1");
  });

  it("changes only the given fields of an edge", () => {
    let graph = createEmptyGraph(true);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 10, 10);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const before = graph;
    graph = updateEdge(graph, graph.edges[0].id, { weight: 7 });
    expect(graph.edges[0].weight).toBe(7);
    expect(graph.edges[0].color).toBe("GRAY");
    expect(graph.edges[0].source).toBe(graph.vertices[0].id);
    expect(before.edges[0].weight).toBe(0);
  });
});
