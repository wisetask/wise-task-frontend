import { describe, expect, it } from "vitest";
import {
  fromBackendGraph,
  hasFractionalWeights,
  toGraphInput,
  type BackendGraph,
} from "./backendFormat";
import { addEdge, addVertex, createEmptyGraph, updateEdge, updateVertex } from "./operations";

function backendTriangle(): BackendGraph {
  return {
    id: "graph-1",
    isDirect: true,
    name: "Треугольник",
    vertexList: [
      { id: 1, label: "A", weight: 0, xCoordinate: 10, yCoordinate: 20, color: "GRAY" },
      { id: 2, label: "B", weight: 5, xCoordinate: 110, yCoordinate: 20, color: "RED" },
      { id: 3, label: "C", weight: 0, xCoordinate: 60, yCoordinate: 100, color: "BLUE" },
    ],
    edgeList: [
      { source: 1, target: 2, weight: 3, label: "x", color: "GREEN" },
      { source: 2, target: 3, weight: 0, label: "", color: "GRAY" },
      { source: 3, target: 3, weight: 0, label: "", color: "GRAY" },
    ],
  };
}

describe("backend graph format", () => {
  it("reads a graph from the backend", () => {
    const { graph, skippedEdges } = fromBackendGraph(backendTriangle());
    expect(skippedEdges).toBe(0);
    expect(graph.name).toBe("Треугольник");
    expect(graph.isDirected).toBe(true);
    expect(graph.vertices.map((vertex) => vertex.label)).toEqual(["A", "B", "C"]);
    expect(graph.vertices[1]).toEqual({
      id: "v2",
      label: "B",
      x: 110,
      y: 20,
      color: "RED",
      weight: 5,
    });
    expect(graph.edges[0].source).toBe("v1");
    expect(graph.edges[0].target).toBe("v2");
    expect(graph.edges[0].label).toBe("x");
    expect(graph.edges[0].color).toBe("GREEN");
    expect(graph.edges[0].weight).toBe(3);
    expect(graph.edges[2].source).toBe(graph.edges[2].target);
  });

  it("fills in what the backend left empty", () => {
    const { graph } = fromBackendGraph({
      isDirect: false,
      name: null,
      vertexList: [
        { id: 7, label: null, weight: null, xCoordinate: null, yCoordinate: null, color: "PINK" },
        null,
        { id: 8, label: "", color: null },
      ],
      edgeList: [null, { source: 7, target: 8 }],
    });
    expect(graph.name).toBe("");
    expect(graph.vertices.length).toBe(2);
    expect(graph.vertices[0].label).toBe("7");
    expect(graph.vertices[0].weight).toBe(0);
    expect(graph.vertices[0].color).toBe("GRAY");
    expect(graph.vertices[1].label).toBe("8");
    expect(graph.vertices[1].x).toBe(150);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].label).toBe("");
    expect(graph.edges[0].weight).toBe(0);
  });

  it("skips edges the editor cannot show and counts them", () => {
    const data = backendTriangle();
    data.isDirect = false;
    data.edgeList.push({ source: 2, target: 1, color: "GRAY" });
    data.edgeList.push({ source: 1, target: 2, color: "GRAY" });
    data.edgeList.push({ source: 1, target: 99, color: "GRAY" });
    data.vertexList.push({ id: 1, label: "дубль", xCoordinate: 0, yCoordinate: 0 });
    const { graph, skippedEdges } = fromBackendGraph(data);
    expect(graph.vertices.length).toBe(3);
    expect(graph.edges.length).toBe(3);
    expect(skippedEdges).toBe(3);
  });

  it("keeps both directions in a directed graph", () => {
    const data = backendTriangle();
    data.edgeList.push({ source: 2, target: 1, color: "GRAY" });
    const { graph, skippedEdges } = fromBackendGraph(data);
    expect(graph.edges.length).toBe(4);
    expect(skippedEdges).toBe(0);
  });

  it("numbers vertices from 1 and links edges by these numbers", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 10.4, 20.6);
    graph = addVertex(graph, 100, 0);
    graph = addEdge(graph, graph.vertices[1].id, graph.vertices[0].id);
    const input = toGraphInput(graph, null);
    expect(input.id).toBeUndefined();
    expect(input.vertexCount).toBe(2);
    expect(input.edgeCount).toBe(1);
    expect(input.isDirect).toBe(false);
    expect(input.isNamed).toBe(false);
    expect(input.name).toBeNull();
    expect(input.vertexList[0]).toEqual({
      id: 1,
      weight: 0,
      label: "1",
      xCoordinate: 10,
      yCoordinate: 21,
      color: "GRAY",
    });
    expect(input.edgeList[0].source).toBe(2);
    expect(input.edgeList[0].target).toBe(1);
  });

  it("keeps the graph id and name when they are known", () => {
    const { graph } = fromBackendGraph(backendTriangle());
    const input = toGraphInput(graph, "graph-1");
    expect(input.id).toBe("graph-1");
    expect(input.isNamed).toBe(true);
    expect(input.name).toBe("Треугольник");
  });

  it("gets the same graph back after a round trip", () => {
    const { graph } = fromBackendGraph(backendTriangle());
    const again = fromBackendGraph({
      isDirect: graph.isDirected,
      name: graph.name,
      vertexList: toGraphInput(graph, null).vertexList,
      edgeList: toGraphInput(graph, null).edgeList,
    });
    expect(again.graph).toEqual(graph);
  });

  it("rounds weights because the backend stores whole numbers", () => {
    let graph = addVertex(createEmptyGraph(false), 0, 0);
    graph = addVertex(graph, 50, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    expect(hasFractionalWeights(graph)).toBe(false);
    graph = updateVertex(graph, graph.vertices[0].id, { weight: 2.5 });
    graph = updateEdge(graph, graph.edges[0].id, { weight: -1.4 });
    expect(hasFractionalWeights(graph)).toBe(true);
    const input = toGraphInput(graph, null);
    expect(input.vertexList[0].weight).toBe(3);
    expect(input.edgeList[0].weight).toBe(-1);
  });
});
