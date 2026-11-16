import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, removeVertex } from "@/entities/graph";
import { isSelected, isSelectionValid } from "./selection";

describe("editor selection", () => {
  it("checks that the selected vertex or edge still exists", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const vertexId = graph.vertices[0].id;
    const edgeId = graph.edges[0].id;
    expect(isSelectionValid(graph, { kind: "vertex", id: vertexId })).toBe(true);
    expect(isSelectionValid(graph, { kind: "edge", id: edgeId })).toBe(true);
    expect(isSelectionValid(graph, null)).toBe(false);
    graph = removeVertex(graph, vertexId);
    expect(isSelectionValid(graph, { kind: "vertex", id: vertexId })).toBe(false);
    expect(isSelectionValid(graph, { kind: "edge", id: edgeId })).toBe(false);
  });

  it("tells whether an item is selected", () => {
    const selection = { kind: "edge" as const, id: "e1" };
    expect(isSelected(selection, "edge", "e1")).toBe(true);
    expect(isSelected(selection, "vertex", "e1")).toBe(false);
    expect(isSelected(null, "edge", "e1")).toBe(false);
  });
});
