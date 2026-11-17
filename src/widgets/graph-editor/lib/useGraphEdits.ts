import {
  addEdge,
  addVertex,
  removeEdge,
  removeVertex,
  updateEdge,
  updateVertex,
  type Graph,
  type GraphColor,
} from "@/entities/graph";
import type { MenuTarget } from "./contextMenu";
import type { Point } from "./geometry";
import {
  isSelectionValid,
  paintSelected,
  removeSelected,
  selectAll,
  type GraphSelection,
} from "./selection";

interface GraphEditsOptions {
  getGraph: () => Graph;
  getSelection: () => GraphSelection | null;
  onChange: (before: Graph, after: Graph) => void;
  onSelect: (selection: GraphSelection | null) => void;
}

export function useGraphEdits(options: GraphEditsOptions) {
  function apply(newGraph: Graph) {
    const graph = options.getGraph();
    if (newGraph === graph) {
      return;
    }
    options.onChange(graph, newGraph);
    const selection = options.getSelection();
    if (selection !== null && !isSelectionValid(newGraph, selection)) {
      options.onSelect(null);
    }
  }

  function addVertexAt(point: Point) {
    const newGraph = addVertex(options.getGraph(), point.x, point.y);
    const newVertex = newGraph.vertices[newGraph.vertices.length - 1];
    apply(newGraph);
    options.onSelect({ kind: "vertex", id: newVertex.id });
  }

  function connect(sourceId: string, targetId: string) {
    const graph = options.getGraph();
    const newGraph = addEdge(graph, sourceId, targetId);
    if (newGraph === graph) {
      return;
    }
    const newEdge = newGraph.edges[newGraph.edges.length - 1];
    apply(newGraph);
    options.onSelect({ kind: "edge", id: newEdge.id });
  }

  function addLoop(vertexId: string) {
    apply(addEdge(options.getGraph(), vertexId, vertexId));
  }

  function deleteVertex(vertexId: string) {
    apply(removeVertex(options.getGraph(), vertexId));
  }

  function deleteEdge(edgeId: string) {
    apply(removeEdge(options.getGraph(), edgeId));
  }

  function deleteSelected() {
    const selection = options.getSelection();
    if (selection === null) {
      return;
    }
    apply(removeSelected(options.getGraph(), selection));
    options.onSelect(null);
  }

  function selectEverything() {
    options.onSelect(selectAll(options.getGraph()));
  }

  function paint(target: MenuTarget, color: GraphColor) {
    const graph = options.getGraph();
    if (target.kind === "vertex") {
      apply(updateVertex(graph, target.id, { color: color }));
    } else if (target.kind === "edge") {
      apply(updateEdge(graph, target.id, { color: color }));
    } else if (target.kind === "group") {
      apply(paintSelected(graph, options.getSelection(), color));
    }
  }

  return {
    apply: apply,
    addVertexAt: addVertexAt,
    connect: connect,
    addLoop: addLoop,
    deleteVertex: deleteVertex,
    deleteEdge: deleteEdge,
    deleteSelected: deleteSelected,
    selectEverything: selectEverything,
    paint: paint,
  };
}
