import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import { alignVertices, focusPoints } from "./align";

function sample(): Graph {
  let graph = createEmptyGraph(false);
  graph = addVertex(graph, 0, 10);
  graph = addVertex(graph, 300, 40);
  graph = addVertex(graph, 50, 100);
  graph = addVertex(graph, 900, 900);
  return graph;
}

function picked(graph: Graph): string[] {
  return [graph.vertices[0].id, graph.vertices[1].id, graph.vertices[2].id];
}

describe("alignVertices", () => {
  it("puts vertices in a row and in a column", () => {
    const graph = sample();
    const row = alignVertices(graph, picked(graph), "row");
    expect(row.vertices.map((vertex) => vertex.y)).toEqual([50, 50, 50, 900]);
    expect(row.vertices.map((vertex) => vertex.x)).toEqual([0, 300, 50, 900]);
    const column = alignVertices(graph, picked(graph), "column");
    expect(column.vertices.map((vertex) => vertex.x)).toEqual([117, 117, 117, 900]);
  });

  it("spreads vertices evenly between the outer ones", () => {
    const graph = sample();
    const spread = alignVertices(graph, picked(graph), "spread-x");
    expect(spread.vertices.map((vertex) => vertex.x)).toEqual([0, 300, 150, 900]);
    const tall = alignVertices(graph, picked(graph), "spread-y");
    expect(tall.vertices.map((vertex) => vertex.y)).toEqual([10, 55, 100, 900]);
  });

  it("needs enough vertices", () => {
    const graph = sample();
    const two = [graph.vertices[0].id, graph.vertices[1].id];
    expect(alignVertices(graph, two, "spread-x")).toBe(graph);
    expect(alignVertices(graph, [graph.vertices[0].id], "row")).toBe(graph);
  });
});

describe("focusPoints", () => {
  it("uses selected vertices and both ends of selected edges", () => {
    let graph = sample();
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[3].id);
    expect(focusPoints(graph, { kind: "edge", id: graph.edges[0].id })).toEqual([
      { x: 0, y: 10 },
      { x: 900, y: 900 },
    ]);
    expect(focusPoints(graph, null)).toEqual([]);
  });
});
