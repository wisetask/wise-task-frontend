import { findEdge, findVertex, moveVertex, type Graph, type Vertex } from "@/entities/graph";
import type { Point } from "./geometry";
import { selectedIds, type GraphSelection } from "./selection";

export type AlignKind = "row" | "column" | "spread-x" | "spread-y";

export const ALIGN_KINDS: AlignKind[] = ["row", "column", "spread-x", "spread-y"];

export const ALIGN_TITLES: Record<AlignKind, string> = {
  row: "В ряд",
  column: "В столбец",
  "spread-x": "Поровну по ширине",
  "spread-y": "Поровну по высоте",
};

export function alignNeeds(kind: AlignKind): number {
  if (kind === "row" || kind === "column") {
    return 2;
  }
  return 3;
}

function pickVertices(graph: Graph, ids: string[]): Vertex[] {
  const vertices: Vertex[] = [];
  for (const id of ids) {
    const vertex = findVertex(graph, id);
    if (vertex !== undefined) {
      vertices.push(vertex);
    }
  }
  return vertices;
}

export function alignVertices(graph: Graph, ids: string[], kind: AlignKind): Graph {
  const vertices = pickVertices(graph, ids);
  if (vertices.length < alignNeeds(kind)) {
    return graph;
  }
  let result = graph;
  if (kind === "row" || kind === "column") {
    let sum = 0;
    for (const vertex of vertices) {
      sum = sum + (kind === "row" ? vertex.y : vertex.x);
    }
    const middle = Math.round(sum / vertices.length);
    for (const vertex of vertices) {
      if (kind === "row") {
        result = moveVertex(result, vertex.id, vertex.x, middle);
      } else {
        result = moveVertex(result, vertex.id, middle, vertex.y);
      }
    }
    return result;
  }
  const alongX = kind === "spread-x";
  const sorted = vertices.slice();
  sorted.sort((first, second) => (alongX ? first.x - second.x : first.y - second.y));
  const start = alongX ? sorted[0].x : sorted[0].y;
  const end = alongX ? sorted[sorted.length - 1].x : sorted[sorted.length - 1].y;
  const step = (end - start) / (sorted.length - 1);
  for (let i = 0; i < sorted.length; i++) {
    const place = Math.round(start + step * i);
    if (alongX) {
      result = moveVertex(result, sorted[i].id, place, sorted[i].y);
    } else {
      result = moveVertex(result, sorted[i].id, sorted[i].x, place);
    }
  }
  return result;
}

export function focusPoints(graph: Graph, selection: GraphSelection | null): Point[] {
  const ids = selectedIds(selection);
  const vertexIds = ids.vertexIds.slice();
  for (const edgeId of ids.edgeIds) {
    const edge = findEdge(graph, edgeId);
    if (edge !== undefined) {
      vertexIds.push(edge.source);
      vertexIds.push(edge.target);
    }
  }
  return pickVertices(graph, vertexIds).map((vertex) => ({ x: vertex.x, y: vertex.y }));
}
