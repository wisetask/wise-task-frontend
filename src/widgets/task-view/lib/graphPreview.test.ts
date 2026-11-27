import { describe, expect, it } from "vitest";
import type { Graph } from "@/entities/graph";
import {
  closeIds,
  graphSummary,
  PREVIEW_MIN_HEIGHT,
  PREVIEW_MIN_WIDTH,
  PREVIEW_PADDING,
  previewBox,
  previewEdges,
  vertexCaption,
} from "./graphPreview";

function vertex(id: string, x: number, y: number) {
  return { id: id, label: id, x: x, y: y, color: "GRAY" as const, weight: 0 };
}

function edge(id: string, source: string, target: string, weight: number) {
  return {
    id: id,
    source: source,
    target: target,
    label: "",
    color: "GRAY" as const,
    weight: weight,
  };
}

function path(isDirected: boolean): Graph {
  return {
    name: "",
    isDirected: isDirected,
    vertices: [vertex("1", 0, 0), vertex("2", 400, 0), vertex("3", 400, 300)],
    edges: [edge("a", "1", "2", 5), edge("b", "2", "3", 0)],
  };
}

describe("graph preview", () => {
  it("fits the vertices with a margin", () => {
    const box = previewBox(path(false));
    expect(box.x).toBe(-PREVIEW_PADDING);
    expect(box.width).toBe(400 + PREVIEW_PADDING * 2);
    expect(box.height).toBe(300 + PREVIEW_PADDING * 2);
  });

  it("does not blow up a tiny graph", () => {
    const tiny: Graph = { name: "", isDirected: false, vertices: [vertex("1", 50, 50)], edges: [] };
    const box = previewBox(tiny);
    expect(box.width).toBe(PREVIEW_MIN_WIDTH);
    expect(box.height).toBe(PREVIEW_MIN_HEIGHT);
    expect(box.x + box.width / 2).toBe(50);
  });

  it("writes weights on edges and stops arrows before the vertex", () => {
    const edges = previewEdges(path(true));
    expect(edges.length).toBe(2);
    expect(edges[0].text).toBe("5");
    expect(edges[0].path).toBe("M0 0 L379 0");
    expect(edges[1].text).toBe("");
  });

  it("bends two opposite arcs apart", () => {
    const graph = path(true);
    graph.edges.push(edge("c", "2", "1", 0));
    const edges = previewEdges(graph);
    expect(edges[0].path).toContain("Q");
    expect(edges[2].path).toContain("Q");
    expect(edges[0].textY).not.toBe(edges[2].textY);
  });

  it("draws a loop above the vertex", () => {
    const graph = path(false);
    graph.edges.push(edge("d", "1", "1", 0));
    expect(previewEdges(graph)[2].path).toContain("C");
  });

  it("describes the graph in words", () => {
    expect(graphSummary(path(false))).toEqual([
      "3 вершины",
      "2 ребра",
      "неориентированный",
      "взвешенный",
    ]);
  });

  it("finds the vertex and its neighbours", () => {
    expect(closeIds(path(false), "2")).toEqual({ "2": true, "1": true, "3": true });
    expect(vertexCaption(path(false), "2")).toBe("Вершина 2: степень 2, соседи 1, 3");
  });
});
