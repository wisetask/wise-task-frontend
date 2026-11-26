import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import { emptyCanvasText, litParts, snapVertex } from "./canvasLook";

describe("litParts", () => {
  it("lights the edges and neighbours of the vertex under the cursor", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    graph = addVertex(graph, 100, 0);
    const ids = graph.vertices.map((vertex) => vertex.id);
    graph = addEdge(graph, ids[0], ids[1]);
    graph = addEdge(graph, ids[0], ids[0]);
    graph = addEdge(graph, ids[1], ids[2]);
    const lit = litParts(graph, ids[0]);
    expect(lit.vertexIds).toEqual([ids[1]]);
    expect(lit.edgeIds).toEqual([graph.edges[0].id, graph.edges[1].id]);
    expect(litParts(graph, null)).toEqual({ vertexIds: [], edgeIds: [] });
  });
});

describe("emptyCanvasText", () => {
  it("tells how to put the first vertex", () => {
    expect(emptyCanvasText(false, "vertex", true)).toContain("Кликните");
    expect(emptyCanvasText(false, "select", true)).toContain("Нажмите 2");
    expect(emptyCanvasText(true, "vertex", true)).toBe("Граф пока пуст");
    expect(emptyCanvasText(false, "vertex", false)).toBe("Граф пока пуст");
  });
});

describe("snapVertex", () => {
  it("pulls the edge to the nearest vertex nearby, but not to its start", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    graph = addVertex(graph, 130, 0);
    const start = graph.vertices[0].id;
    expect(snapVertex(graph, { x: 110, y: 10 }, start, 40)).toBe(graph.vertices[1]);
    expect(snapVertex(graph, { x: 125, y: 0 }, start, 40)).toBe(graph.vertices[2]);
    expect(snapVertex(graph, { x: 5, y: 5 }, start, 40)).toBeNull();
    expect(snapVertex(graph, { x: 60, y: 80 }, start, 40)).toBeNull();
  });
});
