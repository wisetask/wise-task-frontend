import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import { isGraph, loadGraph, SANDBOX_KEY, saveGraph, type GraphStorage } from "./savedGraph";

function memoryStorage(): GraphStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => {
      const value = items.get(key);
      return value === undefined ? null : value;
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

function sampleGraph() {
  let graph = createEmptyGraph(true);
  graph = addVertex(graph, 10, 20);
  graph = addVertex(graph, 100, 40);
  graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
  return graph;
}

describe("saved sandbox graph", () => {
  it("gets back the same graph after saving", () => {
    const storage = memoryStorage();
    const graph = sampleGraph();
    expect(saveGraph(storage, graph)).toBe(true);
    expect(loadGraph(storage)).toEqual(graph);
  });

  it("returns nothing when nothing was saved", () => {
    expect(loadGraph(memoryStorage())).toBeNull();
    expect(loadGraph(null)).toBeNull();
  });

  it("ignores broken or foreign data", () => {
    const storage = memoryStorage();
    storage.setItem(SANDBOX_KEY, "{not json");
    expect(loadGraph(storage)).toBeNull();
    storage.setItem(SANDBOX_KEY, JSON.stringify({ hello: "world" }));
    expect(loadGraph(storage)).toBeNull();
  });

  it("does not accept an edge to a missing vertex", () => {
    const graph = sampleGraph();
    const broken = {
      name: graph.name,
      isDirected: graph.isDirected,
      vertices: [graph.vertices[0]],
      edges: graph.edges,
    };
    expect(isGraph(broken)).toBe(false);
  });

  it("does not accept a vertex without coordinates or with a wrong color", () => {
    const graph = sampleGraph();
    const vertex = graph.vertices[0];
    const noX = { id: vertex.id, label: vertex.label, y: 0, color: "GRAY", weight: 0 };
    const pink = { id: vertex.id, label: vertex.label, x: 0, y: 0, color: "PINK", weight: 0 };
    expect(isGraph({ name: "", isDirected: false, vertices: [noX], edges: [] })).toBe(false);
    expect(isGraph({ name: "", isDirected: false, vertices: [pink], edges: [] })).toBe(false);
  });

  it("tells when the browser refused to save", () => {
    const full: GraphStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(saveGraph(full, sampleGraph())).toBe(false);
    expect(saveGraph(null, sampleGraph())).toBe(false);
  });
});
