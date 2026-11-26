import { describe, expect, it } from "vitest";
import {
  addEdge,
  addVertex,
  createEmptyGraph,
  findEdge,
  updateEdge,
  type Graph,
} from "@/entities/graph";
import { runAlgorithm, type AlgorithmStep } from "./algorithms";

function withVertices(count: number, directed: boolean): Graph {
  let graph = createEmptyGraph(directed);
  for (let i = 0; i < count; i++) {
    graph = addVertex(graph, i * 50, 0);
  }
  return graph;
}

function connect(graph: Graph, pairs: number[][]): Graph {
  let result = graph;
  for (const pair of pairs) {
    result = addEdge(result, result.vertices[pair[0]].id, result.vertices[pair[1]].id);
  }
  return result;
}

function weigh(graph: Graph, weights: number[]): Graph {
  let result = graph;
  for (let i = 0; i < weights.length; i++) {
    result = updateEdge(result, result.edges[i].id, { weight: weights[i] });
  }
  return result;
}

function lastStep(steps: AlgorithmStep[]): AlgorithmStep {
  return steps[steps.length - 1];
}

function labelsByName(graph: Graph, step: AlgorithmStep): string[] {
  return graph.vertices.map((vertex) => step.labels[vertex.id]);
}

describe("runAlgorithm", () => {
  it("finds BFS distances and leaves unreachable vertices out", () => {
    const graph = connect(withVertices(5, false), [
      [0, 1],
      [0, 2],
      [1, 3],
    ]);
    const run = runAlgorithm("bfs", graph, graph.vertices[0].id);
    expect(run.error).toBe("");
    expect(run.title).toBe("Обход в ширину из 1");
    const finish = lastStep(run.steps);
    expect(labelsByName(graph, finish)).toEqual(["0", "1", "1", "2", undefined]);
    expect(finish.treeEdges.length).toBe(3);
    expect(finish.note).toContain("Не достали: 5.");
    expect(run.steps[0].structure).toEqual(["1"]);
  });

  it("numbers DFS vertices in visiting order and comes back", () => {
    const graph = connect(withVertices(4, false), [
      [0, 1],
      [1, 2],
      [0, 3],
    ]);
    const run = runAlgorithm("dfs", graph, graph.vertices[0].id);
    const finish = lastStep(run.steps);
    expect(labelsByName(graph, finish)).toEqual(["1", "2", "3", "4"]);
    expect(finish.note).toBe("Готово: порядок обхода — 1, 2, 3, 4.");
    const notes = run.steps.map((step) => step.note).join(" ");
    expect(notes).toContain("возвращаемся в 2");
  });

  it("follows arrows in a directed graph", () => {
    const graph = connect(withVertices(3, true), [
      [1, 0],
      [1, 2],
    ]);
    const finish = lastStep(runAlgorithm("bfs", graph, graph.vertices[0].id).steps);
    expect(finish.visited.length).toBe(1);
  });

  it("finds shortest paths with Dijkstra and prefers a longer but lighter way", () => {
    let graph = connect(withVertices(3, false), [
      [0, 2],
      [0, 1],
      [1, 2],
    ]);
    graph = weigh(graph, [10, 2, 3]);
    const run = runAlgorithm("dijkstra", graph, graph.vertices[0].id);
    const finish = lastStep(run.steps);
    expect(labelsByName(graph, finish)).toEqual(["0", "2", "5"]);
    const notes = run.steps.map((step) => step.note).join(" ");
    expect(notes).toContain("нашли короче");
    expect(finish.treeEdges).not.toContain(graph.edges[0].id);
  });

  it("counts every edge as 1 when there are no weights", () => {
    const graph = connect(withVertices(3, false), [
      [0, 1],
      [1, 2],
    ]);
    const run = runAlgorithm("dijkstra", graph, graph.vertices[0].id);
    expect(run.steps[0].note).toContain("каждое ребро считаем за 1");
    expect(labelsByName(graph, lastStep(run.steps))).toEqual(["0", "1", "2"]);
  });

  it("refuses negative weights for Dijkstra and directed graphs for Prim", () => {
    let graph = connect(withVertices(2, false), [[0, 1]]);
    graph = weigh(graph, [-1]);
    expect(runAlgorithm("dijkstra", graph, graph.vertices[0].id).error).toContain("отрицательными");
    const directed = connect(withVertices(2, true), [[0, 1]]);
    const primError = runAlgorithm("prim", directed, directed.vertices[0].id).error;
    expect(primError).toContain("неориентированного");
  });

  it("builds the minimum spanning tree with Prim", () => {
    let graph = connect(withVertices(4, false), [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 2],
    ]);
    graph = weigh(graph, [1, 2, 3, 4, 5]);
    const run = runAlgorithm("prim", graph, graph.vertices[0].id);
    const finish = lastStep(run.steps);
    expect(finish.note).toBe("Готово: вес остова — 6.");
    expect(finish.treeEdges.length).toBe(3);
    const heavy = findEdge(graph, graph.edges[4].id);
    expect(finish.treeEdges).not.toContain(heavy === undefined ? "" : heavy.id);
  });
});
