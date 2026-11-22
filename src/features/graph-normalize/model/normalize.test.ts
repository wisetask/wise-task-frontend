import { describe, expect, it } from "vitest";
import { countComponents, type Graph } from "@/entities/graph";
import { splitIntoComponents } from "@/entities/graph";
import {
  detectType,
  isBipartite,
  isChain,
  isCycle,
  isNearlyFull,
  isStar,
  isTree,
} from "./graphType";
import { layoutTree } from "./layouts";
import { arrangeComponents, normalizeGraph } from "./normalize";

function graph(n: number, pairs: number[][], isDirected = false): Graph {
  return {
    name: "Example",
    isDirected,
    vertices: Array.from({ length: n }, (_, i) => ({
      id: String(i),
      label: `Vertex ${i}`,
      x: 17,
      y: -25,
      color: "BLUE",
      weight: i,
    })),
    edges: pairs.map(([source, target], i) => ({
      id: `edge${i}`,
      source: String(source),
      target: String(target),
      label: `Edge ${i}`,
      color: "RED",
      weight: i,
    })),
  };
}

const chain = graph(4, [
  [2, 0],
  [0, 3],
  [3, 1],
]);
const cycle = graph(5, [
  [0, 3],
  [3, 1],
  [1, 4],
  [4, 2],
  [2, 0],
]);
const star = graph(5, [
  [2, 0],
  [2, 1],
  [2, 3],
  [2, 4],
]);
const tree = graph(7, [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 5],
  [3, 6],
]);
const bipartite = graph(6, [
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 3],
  [2, 4],
  [2, 5],
]);
const complete = graph(4, [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
]);
const loop = graph(3, [
  [0, 0],
  [0, 1],
  [1, 2],
]);
const other = graph(6, [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 5],
]);
const samples = [chain, cycle, star, tree, bipartite, complete, loop, other];

function expectSeparated(result: Graph): void {
  for (let i = 0; i < result.vertices.length; i++) {
    const a = result.vertices[i];
    expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
    for (let j = i + 1; j < result.vertices.length; j++) {
      const b = result.vertices[j];
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(60);
    }
  }
}

describe("splitIntoComponents", () => {
  it("splits two parts and shares the T13 component count", () => {
    const input = graph(
      5,
      [
        [1, 0],
        [1, 2],
        [4, 3],
      ],
      true,
    );
    const snapshot = structuredClone(input);
    const parts = splitIntoComponents(input);
    expect(parts.map((part) => part.vertices.map((vertex) => vertex.id))).toEqual([
      ["0", "1", "2"],
      ["3", "4"],
    ]);
    expect(parts.map((part) => part.edges.length)).toEqual([2, 1]);
    expect(countComponents(input)).toBe(parts.length);
    expect(parts[0].name).toBe(input.name);
    expect(parts[0].isDirected).toBe(true);
    expect(input).toEqual(snapshot);
  });

  it("handles isolated vertices, loops, empty graphs and prototype-like ids", () => {
    expect(splitIntoComponents(graph(0, []))).toEqual([]);
    expect(splitIntoComponents(graph(2, [[0, 0]]))).toHaveLength(2);
    const input = graph(2, []);
    input.vertices[0].id = "__proto__";
    input.vertices[1].id = "constructor";
    expect(splitIntoComponents(input)).toHaveLength(2);
  });
});

describe("graph types", () => {
  it.each([
    [chain, "chain", isChain],
    [cycle, "cycle", isCycle],
    [star, "star", isStar],
    [tree, "tree", isTree],
    [bipartite, "bipartite", isBipartite],
    [complete, "nearlyFull", isNearlyFull],
  ] as const)("detects the expected type %#", (input, type, predicate) => {
    expect(predicate(input)).toBe(true);
    expect(detectType(input)).toBe(type);
    expect(detectType({ ...input, isDirected: true })).toBe(type);
  });

  it("respects priority and rejects invalid structures", () => {
    expect(isTree(chain)).toBe(true);
    expect(isTree(star)).toBe(true);
    expect(isBipartite(tree)).toBe(true);
    expect(isBipartite(cycle)).toBe(false);
    expect(isTree(cycle)).toBe(false);
    expect(
      isChain(
        graph(6, [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 4],
          [4, 5],
        ]),
      ),
    ).toBe(false);
    expect(detectType(other)).toBe("other");
    expect(detectType(graph(0, []))).toBe("other");
    expect(detectType(graph(1, []))).toBe("chain");
    for (const predicate of [isChain, isCycle, isStar, isTree, isBipartite, isNearlyFull]) {
      expect(predicate(loop)).toBe(false);
    }
    expect(detectType(loop)).toBe("other");
  });

  it("ignores reciprocal and repeated edges for topology", () => {
    const input = graph(
      3,
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [1, 2],
      ],
      true,
    );
    expect(detectType(input)).toBe("chain");
    expect(normalizeGraph(input).edges).toEqual(input.edges);
  });

  it("uses the legacy 70 percent density threshold", () => {
    const dense = graph(5, [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 2],
      [1, 3],
      [2, 4],
    ]);
    expect(isNearlyFull(dense)).toBe(true);
    expect(isNearlyFull({ ...dense, edges: dense.edges.slice(0, -1) })).toBe(false);
  });
});

describe("manual layouts", () => {
  it("places an explicitly chosen tree root above all other vertices", () => {
    const { vertices } = layoutTree(tree, "6");
    expect(vertices[6].y).toBe(0);
    expect(vertices.slice(0, 6).every((vertex) => vertex.y > 0)).toBe(true);
    expect(layoutTree(tree, "missing")).toEqual(layoutTree(tree));
  });

  it("applies the supplied layout to each component and separates them horizontally", () => {
    const input = graph(4, [
      [0, 1],
      [2, 3],
    ]);
    const result = arrangeComponents(input, (component) => ({
      ...component,
      vertices: component.vertices.map((vertex, index) => ({
        ...vertex,
        x: -50 + 40 * index,
        y: 75,
      })),
    }));
    expect(result.vertices.map(({ x, y }) => [x, y])).toEqual([
      [0, 0],
      [40, 0],
      [140, 0],
      [180, 0],
    ]);
  });
});

describe("normalizeGraph", () => {
  it("places a chain in traversal order on one horizontal line", () => {
    const result = normalizeGraph(chain);
    expect(new Set(result.vertices.map((vertex) => vertex.y)).size).toBe(1);
    for (const edge of result.edges) {
      const a = result.vertices.find((vertex) => vertex.id === edge.source)!;
      const b = result.vertices.find((vertex) => vertex.id === edge.target)!;
      expect(Math.abs(a.x - b.x)).toBe(100);
    }
  });

  it("places the cycle at equal radii and equal edge lengths", () => {
    const result = normalizeGraph(cycle);
    let x = 0;
    let y = 0;
    for (const vertex of result.vertices) {
      x += vertex.x;
      y += vertex.y;
    }
    x /= result.vertices.length;
    y /= result.vertices.length;
    const radius = Math.hypot(result.vertices[0].x - x, result.vertices[0].y - y);
    for (const vertex of result.vertices)
      expect(Math.hypot(vertex.x - x, vertex.y - y)).toBeCloseTo(radius);
    for (const edge of result.edges) {
      const a = result.vertices.find((vertex) => vertex.id === edge.source)!;
      const b = result.vertices.find((vertex) => vertex.id === edge.target)!;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(100);
    }
  });

  it("places tree children below their parent and centers parents above subtrees", () => {
    const result = normalizeGraph(tree);
    for (const edge of result.edges) {
      const parent = result.vertices.find((vertex) => vertex.id === edge.source)!;
      const child = result.vertices.find((vertex) => vertex.id === edge.target)!;
      expect(child.y).toBeGreaterThan(parent.y);
    }
    expect(result.vertices[1].x).toBe((result.vertices[4].x + result.vertices[5].x) / 2);
  });

  it("places a star around its center and a bipartite graph in two columns", () => {
    const result = normalizeGraph(star);
    const center = result.vertices[2];
    for (const vertex of result.vertices) {
      if (vertex.id !== center.id) {
        expect(Math.hypot(vertex.x - center.x, vertex.y - center.y)).toBeCloseTo(100);
      }
    }
    const columns = normalizeGraph(bipartite).vertices;
    expect(new Set(columns.slice(0, 3).map((vertex) => vertex.x)).size).toBe(1);
    expect(new Set(columns.slice(3).map((vertex) => vertex.x)).size).toBe(1);
    expect(columns[0].x).not.toBe(columns[3].x);
  });

  it.each(samples)("preserves data and separation for sample %#", (input) => {
    const snapshot = structuredClone(input);
    const result = normalizeGraph(input);
    expectSeparated(result);
    expect(input).toEqual(snapshot);
    expect(result).toEqual({
      ...input,
      vertices: input.vertices.map((vertex, i) => ({
        ...vertex,
        x: result.vertices[i].x,
        y: result.vertices[i].y,
      })),
    });
    expect(result).not.toBe(input);
    expect(normalizeGraph(result)).toEqual(result);
  });

  it("separates mixed components and isolated vertices", () => {
    const input = graph(18, [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 4],
      [4, 5],
      [3, 6],
      [3, 7],
      [8, 9],
      [8, 10],
      [8, 11],
      [8, 12],
      [13, 14],
      [14, 15],
    ]);
    const result = normalizeGraph(input);
    expectSeparated(result);
    let previousMax = -Infinity;
    for (const part of splitIntoComponents(result)) {
      const xs = part.vertices.map((vertex) => vertex.x);
      expect(Math.min(...xs) - previousMax).toBeGreaterThanOrEqual(99.999);
      previousMax = Math.max(...xs);
    }
  });

  it("handles empty graphs and a single vertex with a loop", () => {
    expect(normalizeGraph(graph(0, []))).toEqual(graph(0, []));
    expectSeparated(normalizeGraph(graph(1, [[0, 0]])));
  });

  it("keeps large circles and broad trees separated", () => {
    const pairs: number[][] = [];
    for (let i = 1; i < 100; i++) pairs.push([Math.floor((i - 1) / 3), i]);
    expectSeparated(normalizeGraph(graph(100, pairs)));
    const circlePairs: number[][] = [];
    for (let i = 0; i < 100; i++) circlePairs.push([i, (i + 1) % 100]);
    expectSeparated(normalizeGraph(graph(100, circlePairs)));
  });
});
