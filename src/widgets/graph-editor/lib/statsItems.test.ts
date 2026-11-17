import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, graphStatistics } from "@/entities/graph";
import { buildStatsItems } from "./statsItems";

describe("stats bar items", () => {
  it("shows numbers of the graph in a fixed order", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    graph = addVertex(graph, 200, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    graph = addEdge(graph, graph.vertices[2].id, graph.vertices[2].id);

    const items = buildStatsItems(graphStatistics(graph));
    const labels: string[] = [];
    const values: number[] = [];
    for (const item of items) {
      labels.push(item.label);
      values.push(item.value);
    }

    expect(labels).toEqual(["Вершин", "Рёбер", "Петель", "Листьев", "Изолированных", "Компонент"]);
    expect(values).toEqual([3, 2, 1, 2, 0, 2]);
  });

  it("shows zeros for an empty graph", () => {
    const items = buildStatsItems(graphStatistics(createEmptyGraph(false)));
    for (const item of items) {
      expect(item.value).toBe(0);
    }
  });
});
