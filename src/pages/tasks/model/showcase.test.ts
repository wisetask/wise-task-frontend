import { describe, expect, it } from "vitest";
import { isProperColoring, latticeEdges, latticePoints, neighbourLists } from "./coloringBackdrop";
import {
  buildRun,
  hamiltonRun,
  isPath,
  matchingRun,
  nextKind,
  SHOWCASE_ORDER,
  SHOWCASE_SEED,
  showcaseForCategory,
  snakeOrder,
  treeRun,
} from "./showcase";

const points = latticePoints(SHOWCASE_SEED);
const edges = latticeEdges(points);

function onEdges(states: string[]): number[] {
  const result: number[] = [];
  for (let index = 0; index < states.length; index++) {
    if (states[index] === "on") {
      result.push(index);
    }
  }
  return result;
}

describe("tasks showcase", () => {
  it("colors every vertex properly", () => {
    const run = buildRun("coloring", points, edges, 12);
    expect(run.vertexColor.includes(-1)).toBe(false);
    expect(isProperColoring(neighbourLists(points.length, edges), run.vertexColor)).toBe(true);
    expect(run.caption).toContain("Жадная раскраска");
  });

  it("builds a spanning tree without cycles", () => {
    const run = treeRun(points, edges);
    const taken = onEdges(run.edgeState);
    expect(taken.length).toBe(points.length - 1);
    const parent: number[] = [];
    for (let index = 0; index < points.length; index++) {
      parent.push(index);
    }
    function root(vertex: number): number {
      let current = vertex;
      while (parent[current] !== current) {
        current = parent[current];
      }
      return current;
    }
    for (const index of taken) {
      const first = root(edges[index][0]);
      const second = root(edges[index][1]);
      expect(first).not.toBe(second);
      parent[first] = second;
    }
  });

  it("matches each vertex at most once", () => {
    const run = matchingRun(points, edges, 0);
    const seen = new Set<number>();
    for (const index of onEdges(run.edgeState)) {
      expect(seen.has(edges[index][0])).toBe(false);
      expect(seen.has(edges[index][1])).toBe(false);
      seen.add(edges[index][0]);
      seen.add(edges[index][1]);
    }
    expect(seen.size).toBeGreaterThan(points.length / 2);
  });

  it("walks a real Hamiltonian path on the backdrop graph", () => {
    const order = snakeOrder(points.length, 10);
    expect(new Set(order).size).toBe(points.length);
    expect(isPath(edges, order)).toBe(true);
    expect(onEdges(hamiltonRun(points, edges).edgeState).length).toBe(points.length - 1);
  });

  it("goes in turn and follows the chosen category", () => {
    expect(nextKind(0, "")).toBe(SHOWCASE_ORDER[0]);
    expect(nextKind(5, "")).toBe(SHOWCASE_ORDER[1]);
    expect(nextKind(0, "Деревья")).toBe("tree");
    expect(showcaseForCategory("Раскраска")).toBe("coloring");
    expect(showcaseForCategory("Паросочетания")).toBe("matching");
    expect(showcaseForCategory("Гамильтоновы циклы")).toBe("hamilton");
    expect(showcaseForCategory("Связность")).toBe("");
  });
});
