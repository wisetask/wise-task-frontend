import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, updateVertex, type Graph } from "@/entities/graph";
import { copySelection, pasteClipboard } from "./clipboard";
import { makeSelection } from "./selection";

function pathWithLoop(): Graph {
  let graph = createEmptyGraph(true);
  graph = addVertex(graph, 0, 0);
  graph = addVertex(graph, 100, 0);
  graph = addVertex(graph, 200, 0);
  const ids = graph.vertices.map((vertex) => vertex.id);
  graph = addEdge(graph, ids[0], ids[1]);
  graph = addEdge(graph, ids[1], ids[2]);
  graph = addEdge(graph, ids[0], ids[0]);
  return graph;
}

describe("editor clipboard", () => {
  it("copies selected vertices and only the edges between them", () => {
    const graph = pathWithLoop();
    const selection = makeSelection([graph.vertices[0].id, graph.vertices[1].id], []);
    const clipboard = copySelection(graph, selection);
    expect(clipboard).not.toBeNull();
    if (clipboard !== null) {
      expect(clipboard.vertices.length).toBe(2);
      expect(clipboard.edges.length).toBe(2);
      expect(clipboard.edges.map((edge) => edge.target)).toEqual([
        graph.vertices[1].id,
        graph.vertices[0].id,
      ]);
    }
  });

  it("has nothing to copy without selected vertices", () => {
    const graph = pathWithLoop();
    expect(copySelection(graph, null)).toBeNull();
    expect(copySelection(graph, { kind: "edge", id: graph.edges[0].id })).toBeNull();
  });

  it("pastes a shifted copy with new ids and selects it", () => {
    const graph = pathWithLoop();
    const clipboard = copySelection(
      graph,
      makeSelection([graph.vertices[0].id, graph.vertices[1].id], []),
    );
    if (clipboard === null) {
      throw new Error("nothing copied");
    }
    const result = pasteClipboard(graph, clipboard, 40);
    expect(result.graph.vertices.length).toBe(5);
    expect(result.graph.edges.length).toBe(5);
    const pasted = result.graph.vertices.slice(3);
    expect(pasted.map((vertex) => vertex.x)).toEqual([40, 140]);
    expect(pasted.map((vertex) => vertex.y)).toEqual([40, 40]);
    expect(pasted[0].id).not.toBe(graph.vertices[0].id);
    expect(result.selection).toEqual(
      makeSelection(
        pasted.map((vertex) => vertex.id),
        result.graph.edges.slice(3).map((edge) => edge.id),
      ),
    );
  });

  it("connects the pasted edges to the pasted vertices", () => {
    const graph = pathWithLoop();
    const clipboard = copySelection(
      graph,
      makeSelection([graph.vertices[0].id, graph.vertices[1].id], []),
    );
    if (clipboard === null) {
      throw new Error("nothing copied");
    }
    const result = pasteClipboard(graph, clipboard, 40);
    const pastedIds = result.graph.vertices.slice(3).map((vertex) => vertex.id);
    for (const edge of result.graph.edges.slice(3)) {
      expect(pastedIds.includes(edge.source)).toBe(true);
      expect(pastedIds.includes(edge.target)).toBe(true);
    }
  });

  it("continues numeric labels and keeps custom ones", () => {
    let graph = pathWithLoop();
    graph = updateVertex(graph, graph.vertices[1].id, { label: "A" });
    const clipboard = copySelection(
      graph,
      makeSelection([graph.vertices[0].id, graph.vertices[1].id], []),
    );
    if (clipboard === null) {
      throw new Error("nothing copied");
    }
    const result = pasteClipboard(graph, clipboard, 40);
    expect(result.graph.vertices.slice(3).map((vertex) => vertex.label)).toEqual(["4", "A"]);
  });

  it("does not change the old graph", () => {
    const graph = pathWithLoop();
    const clipboard = copySelection(graph, makeSelection([graph.vertices[2].id], []));
    if (clipboard === null) {
      throw new Error("nothing copied");
    }
    pasteClipboard(graph, clipboard, 40);
    expect(graph.vertices.length).toBe(3);
    expect(graph.edges.length).toBe(3);
  });
});
