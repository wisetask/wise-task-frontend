import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import { createCodeWatcher, KONAMI_CODE, waveSteps } from "./celebrations";

describe("createCodeWatcher", () => {
  it("fires after the whole code, even after a wrong start", () => {
    const watcher = createCodeWatcher(KONAMI_CODE);
    expect(watcher.push("ArrowUp")).toBe(false);
    for (let i = 0; i < KONAMI_CODE.length - 1; i++) {
      expect(watcher.push(KONAMI_CODE[i])).toBe(false);
    }
    expect(watcher.push("KeyA")).toBe(true);
    expect(watcher.push("KeyA")).toBe(false);
  });
});

describe("waveSteps", () => {
  it("runs from the leftmost vertex of every component", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 100, 0);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 200, 0);
    graph = addVertex(graph, 300, 0);
    const ids = graph.vertices.map((vertex) => vertex.id);
    graph = addEdge(graph, ids[1], ids[0]);
    graph = addEdge(graph, ids[0], ids[2]);
    const steps = waveSteps(graph);
    expect(steps[ids[1]]).toBe(0);
    expect(steps[ids[0]]).toBe(1);
    expect(steps[ids[2]]).toBe(2);
    expect(steps[ids[3]]).toBe(0);
  });
});
