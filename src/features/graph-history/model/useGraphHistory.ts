import { ref, type Ref } from "vue";
import type { Graph } from "@/entities/graph";
import { GraphHistory } from "./history";

export function useGraphHistory(graph: Ref<Graph>) {
  const history = new GraphHistory();
  const canUndo = ref(false);
  const canRedo = ref(false);

  function refresh() {
    canUndo.value = history.canUndo();
    canRedo.value = history.canRedo();
  }

  function record(snapshot: Graph) {
    history.record(snapshot);
    refresh();
  }

  function undo() {
    graph.value = history.undo(graph.value);
    refresh();
  }

  function redo() {
    graph.value = history.redo(graph.value);
    refresh();
  }

  function clear() {
    history.clear();
    refresh();
  }

  return {
    canUndo: canUndo,
    canRedo: canRedo,
    record: record,
    undo: undo,
    redo: redo,
    clear: clear,
  };
}
