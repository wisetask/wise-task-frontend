import {
  findEdge,
  findVertex,
  removeEdge,
  removeVertex,
  updateEdge,
  updateVertex,
  type Graph,
  type GraphColor,
} from "@/entities/graph";
import type { Area } from "./viewport";

export type EditorTool = "select" | "pan" | "vertex" | "edge" | "delete";

export type GraphSelection =
  | { kind: "vertex"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "group"; vertexIds: string[]; edgeIds: string[] };

export interface SelectedIds {
  vertexIds: string[];
  edgeIds: string[];
}

export function selectedIds(selection: GraphSelection | null): SelectedIds {
  if (selection === null) {
    return { vertexIds: [], edgeIds: [] };
  }
  if (selection.kind === "vertex") {
    return { vertexIds: [selection.id], edgeIds: [] };
  }
  if (selection.kind === "edge") {
    return { vertexIds: [], edgeIds: [selection.id] };
  }
  return { vertexIds: selection.vertexIds, edgeIds: selection.edgeIds };
}

export function makeSelection(vertexIds: string[], edgeIds: string[]): GraphSelection | null {
  if (vertexIds.length === 0 && edgeIds.length === 0) {
    return null;
  }
  if (vertexIds.length === 1 && edgeIds.length === 0) {
    return { kind: "vertex", id: vertexIds[0] };
  }
  if (vertexIds.length === 0 && edgeIds.length === 1) {
    return { kind: "edge", id: edgeIds[0] };
  }
  return { kind: "group", vertexIds: vertexIds, edgeIds: edgeIds };
}

export function isSelectionValid(graph: Graph, selection: GraphSelection | null): boolean {
  if (selection === null) {
    return false;
  }
  const ids = selectedIds(selection);
  for (const id of ids.vertexIds) {
    if (findVertex(graph, id) === undefined) {
      return false;
    }
  }
  for (const id of ids.edgeIds) {
    if (findEdge(graph, id) === undefined) {
      return false;
    }
  }
  return true;
}

export function isSelected(
  selection: GraphSelection | null,
  kind: "vertex" | "edge",
  id: string,
): boolean {
  const ids = selectedIds(selection);
  if (kind === "vertex") {
    return ids.vertexIds.includes(id);
  }
  return ids.edgeIds.includes(id);
}

export function toggleSelected(
  selection: GraphSelection | null,
  kind: "vertex" | "edge",
  id: string,
): GraphSelection | null {
  const ids = selectedIds(selection);
  let vertexIds = ids.vertexIds;
  let edgeIds = ids.edgeIds;
  if (kind === "vertex") {
    if (vertexIds.includes(id)) {
      vertexIds = vertexIds.filter((other) => other !== id);
    } else {
      vertexIds = vertexIds.concat([id]);
    }
  } else {
    if (edgeIds.includes(id)) {
      edgeIds = edgeIds.filter((other) => other !== id);
    } else {
      edgeIds = edgeIds.concat([id]);
    }
  }
  return makeSelection(vertexIds, edgeIds);
}

export function selectAll(graph: Graph): GraphSelection | null {
  const vertexIds = graph.vertices.map((vertex) => vertex.id);
  const edgeIds = graph.edges.map((edge) => edge.id);
  return makeSelection(vertexIds, edgeIds);
}

function isInside(area: Area, x: number, y: number): boolean {
  return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
}

export function selectInArea(graph: Graph, area: Area): GraphSelection | null {
  const vertexIds: string[] = [];
  for (const vertex of graph.vertices) {
    if (isInside(area, vertex.x, vertex.y)) {
      vertexIds.push(vertex.id);
    }
  }
  const edgeIds: string[] = [];
  for (const edge of graph.edges) {
    if (vertexIds.includes(edge.source) && vertexIds.includes(edge.target)) {
      edgeIds.push(edge.id);
    }
  }
  return makeSelection(vertexIds, edgeIds);
}

export function verticesToMove(selection: GraphSelection | null, vertexId: string): string[] {
  const ids = selectedIds(selection);
  if (ids.vertexIds.includes(vertexId)) {
    return ids.vertexIds;
  }
  return [vertexId];
}

export function removeSelected(graph: Graph, selection: GraphSelection | null): Graph {
  const ids = selectedIds(selection);
  let result = graph;
  for (const id of ids.edgeIds) {
    result = removeEdge(result, id);
  }
  for (const id of ids.vertexIds) {
    result = removeVertex(result, id);
  }
  return result;
}

export function paintSelected(
  graph: Graph,
  selection: GraphSelection | null,
  color: GraphColor,
): Graph {
  const ids = selectedIds(selection);
  let result = graph;
  for (const id of ids.vertexIds) {
    result = updateVertex(result, id, { color: color });
  }
  for (const id of ids.edgeIds) {
    result = updateEdge(result, id, { color: color });
  }
  return result;
}

export function commonColor(graph: Graph, selection: GraphSelection | null): GraphColor | null {
  const ids = selectedIds(selection);
  const colors: GraphColor[] = [];
  for (const id of ids.vertexIds) {
    const vertex = findVertex(graph, id);
    if (vertex) {
      colors.push(vertex.color);
    }
  }
  for (const id of ids.edgeIds) {
    const edge = findEdge(graph, id);
    if (edge) {
      colors.push(edge.color);
    }
  }
  if (colors.length === 0) {
    return null;
  }
  for (const color of colors) {
    if (color !== colors[0]) {
      return null;
    }
  }
  return colors[0];
}
