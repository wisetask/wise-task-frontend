import { findEdge, findVertex, type Graph } from "@/entities/graph";
import type { EdgeShape, Point } from "./geometry";
import type { EditorTool } from "./selection";

export interface RenameTarget {
  kind: "vertex" | "edge";
  id: string;
}

export function canRename(kind: "vertex" | "edge", tool: EditorTool, readonly: boolean): boolean {
  if (readonly) {
    return false;
  }
  if (tool === "select" || tool === "vertex") {
    return true;
  }
  return kind === "edge" && tool === "edge";
}

export function currentLabel(graph: Graph, target: RenameTarget): string | null {
  if (target.kind === "vertex") {
    const vertex = findVertex(graph, target.id);
    return vertex === undefined ? null : vertex.label;
  }
  const edge = findEdge(graph, target.id);
  return edge === undefined ? null : edge.label;
}

export function newLabel(kind: "vertex" | "edge", oldLabel: string, text: string): string | null {
  const label = text.trim();
  if (label === oldLabel) {
    return null;
  }
  if (label === "" && kind === "vertex") {
    return null;
  }
  return label;
}

export function renamePoint(
  graph: Graph,
  target: RenameTarget,
  edgeShapes: EdgeShape[],
): Point | null {
  if (target.kind === "vertex") {
    const vertex = findVertex(graph, target.id);
    return vertex === undefined ? null : { x: vertex.x, y: vertex.y };
  }
  for (const shape of edgeShapes) {
    if (shape.id === target.id) {
      return { x: shape.labelX, y: shape.labelY };
    }
  }
  return null;
}
