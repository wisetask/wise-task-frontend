import { describe, expect, it } from "vitest";
import type { Graph, GraphColor } from "@/entities/graph";
import { attemptPlace, diffSummary, graphDiff } from "./graphDiff";

function vertex(id: string, label: string, color: GraphColor) {
  return { id: id, label: label, x: Number(label) * 100, y: 0, color: color, weight: 0 };
}

function edge(id: string, source: string, target: string) {
  return {
    id: id,
    source: source,
    target: target,
    label: "",
    color: "GRAY" as GraphColor,
    weight: 0,
  };
}

const task: Graph = {
  name: "",
  isDirected: false,
  vertices: [vertex("a", "1", "GRAY"), vertex("b", "2", "GRAY"), vertex("c", "3", "GRAY")],
  edges: [edge("e1", "a", "b"), edge("e2", "b", "c")],
};

describe("graph diff", () => {
  it("matches vertices and edges by labels", () => {
    const answer: Graph = {
      name: "",
      isDirected: false,
      vertices: [vertex("x", "1", "RED"), vertex("y", "2", "GRAY"), vertex("z", "4", "GRAY")],
      edges: [edge("f1", "y", "x"), edge("f2", "y", "z")],
    };
    const diff = graphDiff(task, answer);
    expect(diff.counts).toEqual({
      addedVertices: 1,
      removedVertices: 1,
      recoloredVertices: 1,
      addedEdges: 1,
      removedEdges: 1,
    });
    const states: string[] = [];
    for (const item of diff.vertices) {
      states.push(item.label + ":" + item.state);
    }
    expect(states).toEqual(["1:recolored", "2:same", "4:added", "3:removed"]);
  });

  it("describes the changes in words", () => {
    expect(
      diffSummary({
        addedVertices: 2,
        removedVertices: 0,
        recoloredVertices: 0,
        addedEdges: 1,
        removedEdges: 5,
      }),
    ).toEqual(["Добавлено: 2 вершины и 1 ребро", "Удалено: 5 рёбер"]);
    expect(graphDiff(task, task).counts.addedEdges).toBe(0);
    expect(diffSummary(graphDiff(task, task).counts)).toEqual(["Граф задачи не менялся"]);
  });

  it("finds the neighbours of an attempt", () => {
    expect(attemptPlace(["s1", "s2", "s3"], "s2")).toEqual({
      index: 1,
      total: 3,
      previous: "s1",
      next: "s3",
    });
    expect(attemptPlace(["s1"], "s1")).toEqual({ index: 0, total: 1, previous: null, next: null });
    expect(attemptPlace(["s1"], "s9")).toBeNull();
  });
});
