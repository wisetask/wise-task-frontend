import { describe, expect, it } from "vitest";
import { ref, toRaw } from "vue";
import { addVertex, createEmptyGraph, type Graph } from "@/entities/graph";
import { useGraphHistory } from "./useGraphHistory";

describe("useGraphHistory", () => {
  it("undoes and redoes a change of the graph", () => {
    const empty = createEmptyGraph(false);
    const graph = ref<Graph>(empty);
    const history = useGraphHistory(graph);

    history.record(graph.value);
    const withVertex = addVertex(graph.value, 10, 10);
    graph.value = withVertex;

    history.undo();
    expect(toRaw(graph.value)).toBe(empty);

    history.redo();
    expect(toRaw(graph.value)).toBe(withVertex);
  });

  it("tells when undo and redo are available", () => {
    const graph = ref<Graph>(createEmptyGraph(false));
    const history = useGraphHistory(graph);
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);

    history.record(graph.value);
    graph.value = addVertex(graph.value, 0, 0);
    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);

    history.undo();
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(true);

    history.clear();
    expect(history.canRedo.value).toBe(false);
  });
});
