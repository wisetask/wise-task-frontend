import { hasEdge } from "./operations";
import type { Edge, Graph, GraphColor, Vertex } from "./types";

export interface BackendVertex {
  id: number;
  weight?: number | null;
  label?: string | null;
  xCoordinate?: number | null;
  yCoordinate?: number | null;
  color?: string | null;
}

export interface BackendEdge {
  source: number;
  target: number;
  weight?: number | null;
  label?: string | null;
  color?: string | null;
}

export interface BackendGraph {
  id?: string | null;
  isDirect: boolean;
  vertexList: (BackendVertex | null)[];
  edgeList: (BackendEdge | null)[];
  name?: string | null;
}

export interface GraphInput {
  id?: string;
  vertexCount: number;
  edgeCount: number;
  isDirect: boolean;
  vertexList: {
    id: number;
    weight: number;
    label: string;
    xCoordinate: number;
    yCoordinate: number;
    color: GraphColor;
  }[];
  edgeList: {
    source: number;
    target: number;
    weight: number;
    label: string;
    color: GraphColor;
  }[];
  isNamed: boolean;
  name: string | null;
}

export interface ImportedGraph {
  graph: Graph;
  skippedEdges: number;
}

const COLORS: GraphColor[] = ["GRAY", "RED", "GREEN", "BLUE"];
const FALLBACK_STEP = 150;
const FALLBACK_COLUMNS = 6;

function readColor(value: string | null | undefined): GraphColor {
  for (const color of COLORS) {
    if (value === color) {
      return color;
    }
  }
  return "GRAY";
}

function readNumber(value: number | null | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

function readText(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}

export function vertexIdFromBackend(backendId: number): string {
  return "v" + backendId;
}

export function fromBackendGraph(data: BackendGraph): ImportedGraph {
  const vertices: Vertex[] = [];
  const vertexIds: string[] = [];
  let index = 0;
  for (const item of data.vertexList) {
    if (item === null || vertexIds.includes(vertexIdFromBackend(item.id))) {
      continue;
    }
    vertexIds.push(vertexIdFromBackend(item.id));
    const label = readText(item.label);
    vertices.push({
      id: vertexIdFromBackend(item.id),
      label: label === "" ? String(item.id) : label,
      x: readNumber(item.xCoordinate, (index % FALLBACK_COLUMNS) * FALLBACK_STEP),
      y: readNumber(item.yCoordinate, Math.floor(index / FALLBACK_COLUMNS) * FALLBACK_STEP),
      color: readColor(item.color),
      weight: readNumber(item.weight, 0),
    });
    index = index + 1;
  }

  let graph: Graph = {
    name: readText(data.name),
    isDirected: data.isDirect,
    vertices: vertices,
    edges: [],
  };

  let skippedEdges = 0;
  let edgeNumber = 0;
  for (const item of data.edgeList) {
    if (item === null) {
      continue;
    }
    const source = vertexIdFromBackend(item.source);
    const target = vertexIdFromBackend(item.target);
    if (!vertexIds.includes(source) || !vertexIds.includes(target)) {
      skippedEdges = skippedEdges + 1;
      continue;
    }
    if (hasEdge(graph, source, target)) {
      skippedEdges = skippedEdges + 1;
      continue;
    }
    edgeNumber = edgeNumber + 1;
    const edge: Edge = {
      id: "e" + edgeNumber,
      source: source,
      target: target,
      label: readText(item.label),
      color: readColor(item.color),
      weight: readNumber(item.weight, 0),
    };
    graph = {
      name: graph.name,
      isDirected: graph.isDirected,
      vertices: graph.vertices,
      edges: graph.edges.concat([edge]),
    };
  }

  return { graph: graph, skippedEdges: skippedEdges };
}

export function toGraphInput(graph: Graph, id: string | null): GraphInput {
  const numbers = new Map<string, number>();
  const vertexList: GraphInput["vertexList"] = [];
  let number = 1;
  for (const vertex of graph.vertices) {
    numbers.set(vertex.id, number);
    vertexList.push({
      id: number,
      weight: Math.round(vertex.weight),
      label: vertex.label,
      xCoordinate: Math.round(vertex.x),
      yCoordinate: Math.round(vertex.y),
      color: vertex.color,
    });
    number = number + 1;
  }

  const edgeList: GraphInput["edgeList"] = [];
  for (const edge of graph.edges) {
    const source = numbers.get(edge.source);
    const target = numbers.get(edge.target);
    if (source === undefined || target === undefined) {
      continue;
    }
    edgeList.push({
      source: source,
      target: target,
      weight: Math.round(edge.weight),
      label: edge.label,
      color: edge.color,
    });
  }

  const input: GraphInput = {
    vertexCount: vertexList.length,
    edgeCount: edgeList.length,
    isDirect: graph.isDirected,
    vertexList: vertexList,
    edgeList: edgeList,
    isNamed: graph.name !== "",
    name: graph.name === "" ? null : graph.name,
  };
  if (id !== null) {
    input.id = id;
  }
  return input;
}

export function hasFractionalWeights(graph: Graph): boolean {
  for (const vertex of graph.vertices) {
    if (!Number.isInteger(vertex.weight)) {
      return true;
    }
  }
  for (const edge of graph.edges) {
    if (!Number.isInteger(edge.weight)) {
      return true;
    }
  }
  return false;
}
