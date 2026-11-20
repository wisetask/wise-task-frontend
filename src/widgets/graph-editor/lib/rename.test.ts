import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, updateEdge, type Graph } from "@/entities/graph";
import { buildEdgeShapes, VERTEX_RADIUS } from "./geometry";
import { canRename, currentLabel, newLabel, renamePoint, type RenameTarget } from "./rename";

function pair(): Graph {
  let graph = createEmptyGraph(false);
  graph = addVertex(graph, 0, 0);
  graph = addVertex(graph, 200, 0);
  graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
  return updateEdge(graph, graph.edges[0].id, { label: "a" });
}

describe("rename on the canvas", () => {
  it("allows renaming only where a double click is free", () => {
    expect(canRename("vertex", "select", false)).toBe(true);
    expect(canRename("vertex", "vertex", false)).toBe(true);
    expect(canRename("vertex", "edge", false)).toBe(false);
    expect(canRename("edge", "edge", false)).toBe(true);
    expect(canRename("edge", "delete", false)).toBe(false);
    expect(canRename("vertex", "pan", false)).toBe(false);
    expect(canRename("vertex", "select", true)).toBe(false);
  });

  it("reads the current label", () => {
    const graph = pair();
    expect(currentLabel(graph, { kind: "vertex", id: graph.vertices[1].id })).toBe("2");
    expect(currentLabel(graph, { kind: "edge", id: graph.edges[0].id })).toBe("a");
    expect(currentLabel(graph, { kind: "vertex", id: "missing" })).toBeNull();
  });

  it("keeps the old label when nothing changed or a vertex label is empty", () => {
    expect(newLabel("vertex", "1", "  A ")).toBe("A");
    expect(newLabel("vertex", "1", "1")).toBeNull();
    expect(newLabel("vertex", "1", "   ")).toBeNull();
    expect(newLabel("edge", "a", "")).toBe("");
    expect(newLabel("edge", "", " ")).toBeNull();
  });

  it("puts the field on the vertex or on the edge label", () => {
    const graph = pair();
    const shapes = buildEdgeShapes(graph, VERTEX_RADIUS);
    const vertexTarget: RenameTarget = { kind: "vertex", id: graph.vertices[1].id };
    expect(renamePoint(graph, vertexTarget, shapes)).toEqual({ x: 200, y: 0 });
    const edgeTarget: RenameTarget = { kind: "edge", id: graph.edges[0].id };
    expect(renamePoint(graph, edgeTarget, shapes)).toEqual({ x: 100, y: 0 });
    expect(renamePoint(graph, { kind: "edge", id: "missing" }, shapes)).toBeNull();
  });
});
