import { describe, expect, it } from "vitest";
import { addVertex, createEmptyGraph, moveVertex } from "@/entities/graph";
import { GraphHistory } from "./history";

describe("graph history", () => {
  it("undoes three vertex additions in reverse order", () => {
    const history = new GraphHistory();
    const empty = createEmptyGraph(false);
    history.record(empty);
    const first = addVertex(empty, 0, 0);
    history.record(first);
    const second = addVertex(first, 10, 0);
    history.record(second);
    const third = addVertex(second, 20, 0);

    let graph = history.undo(third);
    expect(graph).toBe(second);
    graph = history.undo(graph);
    expect(graph).toBe(first);
    graph = history.undo(graph);
    expect(graph).toBe(empty);
    expect(history.canUndo()).toBe(false);
  });

  it("redoes an undone change", () => {
    const history = new GraphHistory();
    const empty = createEmptyGraph(false);
    history.record(empty);
    const graph = addVertex(empty, 0, 0);

    const undone = history.undo(graph);
    expect(history.canRedo()).toBe(true);
    const redone = history.redo(undone);
    expect(redone).toBe(graph);
    expect(history.canRedo()).toBe(false);
    expect(history.undo(redone)).toBe(empty);
  });

  it("discards redo after a new change", () => {
    const history = new GraphHistory();
    const empty = createEmptyGraph(false);
    history.record(empty);
    const graph = addVertex(empty, 0, 0);
    const undone = history.undo(graph);

    history.record(undone);
    const changed = addVertex(undone, 10, 10);
    expect(history.canRedo()).toBe(false);
    expect(history.redo(changed)).toBe(changed);
  });

  it("returns the current graph when history is empty", () => {
    const history = new GraphHistory();
    const graph = createEmptyGraph(false);

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo(graph)).toBe(graph);
    expect(history.redo(graph)).toBe(graph);
  });

  it("keeps only the 100 most recent snapshots", () => {
    const history = new GraphHistory();
    let graph = createEmptyGraph(false);
    for (let i = 0; i < 105; i++) {
      history.record(graph);
      graph = addVertex(graph, i, 0);
    }

    for (let i = 0; i < 100; i++) {
      expect(history.canUndo()).toBe(true);
      graph = history.undo(graph);
    }
    expect(graph.vertices.length).toBe(5);
    expect(history.canUndo()).toBe(false);
    expect(history.undo(graph)).toBe(graph);
  });

  it("clears both undo and redo history", () => {
    const history = new GraphHistory();
    const empty = createEmptyGraph(false);
    history.record(empty);
    const first = addVertex(empty, 0, 0);
    history.record(first);
    const second = addVertex(first, 10, 0);
    const graph = history.undo(second);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(true);

    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo(graph)).toBe(graph);
    expect(history.redo(graph)).toBe(graph);
  });

  it("restores the original vertex position after a move", () => {
    const history = new GraphHistory();
    const graph = addVertex(createEmptyGraph(false), 10, 20);
    history.record(graph);
    const moved = moveVertex(graph, graph.vertices[0].id, 30, 40);

    expect(moved.vertices[0].x).toBe(30);
    expect(moved.vertices[0].y).toBe(40);
    const restored = history.undo(moved);
    expect(restored.vertices[0].x).toBe(10);
    expect(restored.vertices[0].y).toBe(20);
  });
});
