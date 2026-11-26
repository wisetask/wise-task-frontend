import { describe, expect, it } from "vitest";
import { addEdge, addVertex, createEmptyGraph } from "@/entities/graph";
import {
  cometDuration,
  cometPoints,
  createCodeWatcher,
  DEMON_CODE,
  discoverShapes,
  JACKPOT_CODE,
  reelStopTime,
  reelSymbol,
  KONAMI_CODE,
  waveSteps,
} from "./celebrations";

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

describe("DEMON_CODE", () => {
  it("fires on three sixes in a row", () => {
    const watcher = createCodeWatcher(DEMON_CODE);
    expect(watcher.push("6")).toBe(false);
    expect(watcher.push("6")).toBe(false);
    expect(watcher.push("6")).toBe(true);
  });
});

describe("discoverShapes", () => {
  it("finds nothing special in a small path", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 0, 0);
    graph = addVertex(graph, 50, 0);
    graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    expect(discoverShapes(graph)).toEqual([]);
  });

  it("sees both K5 and its Euler circuit", () => {
    let graph = createEmptyGraph(false);
    for (let i = 0; i < 5; i++) {
      graph = addVertex(graph, i * 50, 0);
    }
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        graph = addEdge(graph, graph.vertices[i].id, graph.vertices[j].id);
      }
    }
    const kinds = discoverShapes(graph).map((item) => item.kind);
    expect(kinds).toEqual(["k5", "euler"]);
  });
});

describe("comet", () => {
  it("follows the vertices and keeps a sane speed", () => {
    let graph = createEmptyGraph(false);
    graph = addVertex(graph, 10, 20);
    graph = addVertex(graph, 30, 40);
    const ids = [graph.vertices[0].id, graph.vertices[1].id, "missing", graph.vertices[0].id];
    expect(cometPoints(graph, ids)).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 10, y: 20 },
    ]);
    expect(cometDuration(2)).toBe(1600);
    expect(cometDuration(10)).toBe(2800);
    expect(cometDuration(100)).toBe(7000);
  });
});

describe("jackpot", () => {
  it("spins different symbols and stops on seven one by one", () => {
    const watcher = createCodeWatcher(JACKPOT_CODE);
    watcher.push("7");
    watcher.push("7");
    expect(watcher.push("7")).toBe(true);
    expect(reelSymbol(0, 0, false)).not.toBe(reelSymbol(1, 0, false));
    expect(reelSymbol(5, 3, true)).toBe("7");
    expect(reelStopTime(1)).toBeGreaterThan(reelStopTime(0));
    expect(reelStopTime(100)).toBe(2300);
  });
});
