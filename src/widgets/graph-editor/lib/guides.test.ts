import { describe, expect, it } from "vitest";
import { addVertex, createEmptyGraph } from "@/entities/graph";
import { snapToGuides } from "./guides";

describe("snapToGuides", () => {
  it("lines a vertex up with its neighbours and draws the guides", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 100, 100);
    graph = addVertex(graph, 300, 200);
    graph = addVertex(graph, 100, 400);
    graph = addVertex(graph, 500, 500);
    const moving = graph.vertices[3].id;
    const result = snapToGuides(graph, [moving], { x: 105, y: 196 }, 8);
    expect(result.point).toEqual({ x: 100, y: 200 });
    expect(result.guides.length).toBe(2);
    expect(result.guides[0]).toEqual({ vertical: true, position: 100, from: 70, to: 430 });
    expect(result.guides[1]).toEqual({ vertical: false, position: 200, from: 70, to: 330 });
  });

  it("leaves the point alone when nothing is close and ignores moving vertices", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 100, 100);
    graph = addVertex(graph, 103, 300);
    const moving = graph.vertices[1].id;
    const far = snapToGuides(graph, [moving], { x: 140, y: 300 }, 8);
    expect(far.point).toEqual({ x: 140, y: 300 });
    expect(far.guides).toEqual([]);
    const self = snapToGuides(graph, [graph.vertices[0].id, moving], { x: 104, y: 99 }, 8);
    expect(self.guides).toEqual([]);
  });
});
