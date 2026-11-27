import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import { graphFacts, specialGraph } from "./graphFacts";

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

function factValue(graph: Graph, title: string): boolean {
  for (const item of graphFacts(graph)) {
    if (item.title === title) {
      return item.value;
    }
  }
  throw new Error("no fact " + title);
}

function completeGraph(count: number): Graph {
  const pairs: number[][] = [];
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      pairs.push([i, j]);
    }
  }
  return connect(withVertices(count, false), pairs);
}

const PETERSEN = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [0, 5],
  [1, 6],
  [2, 7],
  [3, 8],
  [4, 9],
  [5, 7],
  [7, 9],
  [9, 6],
  [6, 8],
  [8, 5],
];

describe("graphFacts", () => {
  it("says nothing about an empty graph", () => {
    expect(graphFacts(createEmptyGraph(false))).toEqual([]);
  });

  it("recognises a path as a tree", () => {
    const path = connect(withVertices(4, false), [
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(factValue(path, "Связный")).toBe(true);
    expect(factValue(path, "Дерево")).toBe(true);
    expect(factValue(path, "Есть цикл")).toBe(false);
    expect(factValue(path, "Двудольный")).toBe(true);
    expect(factValue(path, "Регулярный")).toBe(false);
  });

  it("sees the cycle and the odd length of a triangle", () => {
    const triangle = completeGraph(3);
    expect(factValue(triangle, "Дерево")).toBe(false);
    expect(factValue(triangle, "Есть цикл")).toBe(true);
    expect(factValue(triangle, "Двудольный")).toBe(false);
    expect(factValue(triangle, "Полный")).toBe(true);
    const regular = graphFacts(triangle)[5];
    expect(regular.value).toBe(true);
    expect(regular.note).toBe("степень 2");
  });

  it("counts a loop as a cycle", () => {
    const loop = connect(withVertices(1, false), [[0, 0]]);
    expect(factValue(loop, "Есть цикл")).toBe(true);
    expect(factValue(loop, "Дерево")).toBe(false);
  });

  it("knows strong connectivity and cycles of a directed graph", () => {
    const chain = connect(withVertices(3, true), [
      [0, 1],
      [1, 2],
    ]);
    expect(factValue(chain, "Слабо связный")).toBe(true);
    expect(factValue(chain, "Сильно связный")).toBe(false);
    expect(factValue(chain, "Есть цикл")).toBe(false);
    const ring = connect(chain, [[2, 0]]);
    expect(factValue(ring, "Сильно связный")).toBe(true);
    expect(factValue(ring, "Есть цикл")).toBe(true);
  });
});

describe("specialGraph", () => {
  it("finds K5 and nothing in K4", () => {
    expect(specialGraph(completeGraph(5))).toBe("k5");
    expect(specialGraph(completeGraph(4))).toBeNull();
  });

  it("finds K3,3", () => {
    const pairs: number[][] = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 3; j < 6; j++) {
        pairs.push([i, j]);
      }
    }
    expect(specialGraph(connect(withVertices(6, false), pairs))).toBe("k33");
  });

  it("finds the Petersen graph but not the prism-like look-alike", () => {
    expect(specialGraph(connect(withVertices(10, false), PETERSEN))).toBe("petersen");
    const prism = PETERSEN.slice(0, 10).concat([
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 5],
    ]);
    expect(specialGraph(connect(withVertices(10, false), prism))).toBeNull();
  });
});
