import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, setDirected, updateEdge } from "@/entities/graph";
import { describeEdge, describeGroup, edgeText, pluralize } from "./labels";

function graphWithOneEdge() {
  let graph = createEmptyGraph(false);
  graph = addVertex(graph, 0, 0);
  graph = addVertex(graph, 100, 0);
  graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
  return graph;
}

describe("graph labels", () => {
  it("builds edge text from label and weight", () => {
    let graph = graphWithOneEdge();
    const edgeId = graph.edges[0].id;
    expect(edgeText(graph.edges[0])).toBe("");
    graph = updateEdge(graph, edgeId, { weight: 5 });
    expect(edgeText(graph.edges[0])).toBe("5");
    graph = updateEdge(graph, edgeId, { label: "a" });
    expect(edgeText(graph.edges[0])).toBe("a · 5");
    graph = updateEdge(graph, edgeId, { weight: 0 });
    expect(edgeText(graph.edges[0])).toBe("a");
  });

  it("names an edge by its ends", () => {
    let graph = graphWithOneEdge();
    expect(describeEdge(graph, graph.edges[0])).toBe("Ребро 1 — 2");
    graph = setDirected(graph, true);
    expect(describeEdge(graph, graph.edges[0])).toBe("Ребро 1 → 2");
  });

  it("picks the right Russian word form for a number", () => {
    expect(pluralize(1, "вершина", "вершины", "вершин")).toBe("вершина");
    expect(pluralize(3, "вершина", "вершины", "вершин")).toBe("вершины");
    expect(pluralize(5, "вершина", "вершины", "вершин")).toBe("вершин");
    expect(pluralize(11, "вершина", "вершины", "вершин")).toBe("вершин");
    expect(pluralize(21, "вершина", "вершины", "вершин")).toBe("вершина");
    expect(pluralize(112, "вершина", "вершины", "вершин")).toBe("вершин");
  });

  it("describes a selected group", () => {
    expect(describeGroup(3, 2)).toBe("Выбрано: 3 вершины, 2 ребра");
    expect(describeGroup(5, 0)).toBe("Выбрано: 5 вершин");
    expect(describeGroup(0, 1)).toBe("Выбрано: 1 ребро");
  });
});
