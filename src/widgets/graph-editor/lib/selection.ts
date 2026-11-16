import { findEdge, findVertex, type Graph } from "@/entities/graph";

export type EditorTool = "select" | "vertex" | "edge" | "delete";

export interface GraphSelection {
  kind: "vertex" | "edge";
  id: string;
}

export function isSelectionValid(graph: Graph, selection: GraphSelection | null): boolean {
  if (selection === null) {
    return false;
  }
  if (selection.kind === "vertex") {
    return findVertex(graph, selection.id) !== undefined;
  }
  return findEdge(graph, selection.id) !== undefined;
}

export function isSelected(
  selection: GraphSelection | null,
  kind: "vertex" | "edge",
  id: string,
): boolean {
  if (selection === null) {
    return false;
  }
  return selection.kind === kind && selection.id === id;
}
