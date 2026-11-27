import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import { degreeMap } from "./degrees";

describe("degreeMap", () => {
  it("counts every end of every edge, a loop twice", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    graph = addVertex(graph, 100, 0);
    const ids = graph.vertices.map((vertex) => vertex.id);
    graph = addEdge(graph, ids[0], ids[1]);
    graph = addEdge(graph, ids[0], ids[0]);
    const degrees = degreeMap(graph);
    expect(degrees[ids[0]]).toBe(3);
    expect(degrees[ids[1]]).toBe(1);
    expect(degrees[ids[2]]).toBe(0);
  });
});
