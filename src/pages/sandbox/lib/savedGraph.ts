import type { Edge, Graph, Vertex } from "@/entities/graph";

export const SANDBOX_KEY = "wisetask.sandbox.graph";

export interface GraphStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const COLORS = ["RED", "GREEN", "BLUE", "GRAY"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasCommonFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.color === "string" &&
    COLORS.includes(value.color) &&
    typeof value.weight === "number"
  );
}

function isVertex(value: unknown): value is Vertex {
  if (!isObject(value) || !hasCommonFields(value)) {
    return false;
  }
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function isEdge(value: unknown, vertexIds: string[]): value is Edge {
  if (!isObject(value) || !hasCommonFields(value)) {
    return false;
  }
  if (typeof value.source !== "string" || typeof value.target !== "string") {
    return false;
  }
  return vertexIds.includes(value.source) && vertexIds.includes(value.target);
}

export function isGraph(value: unknown): value is Graph {
  if (!isObject(value)) {
    return false;
  }
  if (typeof value.name !== "string" || typeof value.isDirected !== "boolean") {
    return false;
  }
  if (!Array.isArray(value.vertices) || !Array.isArray(value.edges)) {
    return false;
  }
  const vertexIds: string[] = [];
  for (const vertex of value.vertices) {
    if (!isVertex(vertex)) {
      return false;
    }
    vertexIds.push(vertex.id);
  }
  for (const edge of value.edges) {
    if (!isEdge(edge, vertexIds)) {
      return false;
    }
  }
  return true;
}

export function browserStorage(): GraphStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadGraph(storage: GraphStorage | null): Graph | null {
  if (storage === null) {
    return null;
  }
  try {
    const text = storage.getItem(SANDBOX_KEY);
    if (text === null) {
      return null;
    }
    const data = JSON.parse(text);
    if (isGraph(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveGraph(storage: GraphStorage | null, graph: Graph): boolean {
  if (storage === null) {
    return false;
  }
  try {
    storage.setItem(SANDBOX_KEY, JSON.stringify(graph));
    return true;
  } catch {
    return false;
  }
}
