import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, setDirected, updateEdge } from "@/entities/graph";
import { describeEdge, edgeText } from "./labels";

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
});
