import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import { buildEdgeShapes, curvedEdgePath, loopPath, straightEdgePath } from "./geometry";

describe("graph canvas geometry", () => {
  it("draws a straight edge from circle border to circle border", () => {
    const path = straightEdgePath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
    expect(path).toBe("M 10 0 L 90 0");
  });

  it("hides an edge when the vertices overlap", () => {
    expect(straightEdgePath({ x: 0, y: 0 }, { x: 15, y: 0 }, 10)).toBe("");
  });

  it("bends a curved edge to the side", () => {
    const path = curvedEdgePath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 20);
    expect(path).toBe("M 9.3 3.7 Q 50 20 90.7 3.7");
  });

  it("draws a loop above the vertex", () => {
    const path = loopPath({ x: 100, y: 100 }, 20);
    expect(path).toBe("M 90 82.7 C 68 36 132 36 110 82.7");
  });

  it("picks the right shape for each edge", () => {
    let graph = createEmptyGraph(true);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    graph = addVertex(graph, 0, 100);
    const a = graph.vertices[0].id;
    const b = graph.vertices[1].id;
    const c = graph.vertices[2].id;
    graph = addEdge(graph, a, b);
    graph = addEdge(graph, b, a);
    graph = addEdge(graph, a, c);
    graph = addEdge(graph, c, c);
    const shapes = buildEdgeShapes(graph, 10);
    expect(shapes.length).toBe(4);
    expect(shapes[0].path).toContain("Q");
    expect(shapes[1].path).toContain("Q");
    expect(shapes[2].path).toContain("L");
    expect(shapes[3].path).toContain("C");
  });

  it("does not curve edges in an undirected graph", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    const shapes = buildEdgeShapes(graph, 10);
    expect(shapes[0].path).toContain("L");
  });
});
