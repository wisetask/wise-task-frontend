import {
  fromBackendGraph,
  toGraphInput,
  type BackendEdge,
  type BackendVertex,
} from "./backendFormat";
import type { Graph } from "./types";

export type GraphFileResult =
  { ok: true; graph: Graph; skippedEdges: number } | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(error: string): GraphFileResult {
  return { ok: false, error: error };
}

export function graphToFileText(graph: Graph): string {
  return JSON.stringify(toGraphInput(graph, null), null, 2) + "\n";
}

export function graphFileName(graph: Graph): string {
  const name = graph.name.trim().replace(/[\\/:*?"<>|]/g, "_");
  if (name === "") {
    return "graph.json";
  }
  return name + ".json";
}

export function graphFromFileText(text: string): GraphFileResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return failure("Файл не похож на JSON. Откройте файл, который скачали из редактора.");
  }
  if (!isObject(data) || !Array.isArray(data.vertexList) || !Array.isArray(data.edgeList)) {
    return failure("В файле нет графа: не найдены списки vertexList и edgeList.");
  }

  const vertexList: (BackendVertex | null)[] = [];
  for (let i = 0; i < data.vertexList.length; i++) {
    const item: unknown = data.vertexList[i];
    if (item === null) {
      vertexList.push(null);
      continue;
    }
    if (!isObject(item) || typeof item.id !== "number") {
      return failure("Вершина № " + (i + 1) + " без числового id.");
    }
    vertexList.push({
      id: item.id,
      weight: typeof item.weight === "number" ? item.weight : null,
      label: typeof item.label === "string" ? item.label : null,
      xCoordinate: typeof item.xCoordinate === "number" ? item.xCoordinate : null,
      yCoordinate: typeof item.yCoordinate === "number" ? item.yCoordinate : null,
      color: typeof item.color === "string" ? item.color : null,
    });
  }

  const edgeList: (BackendEdge | null)[] = [];
  for (let i = 0; i < data.edgeList.length; i++) {
    const item: unknown = data.edgeList[i];
    if (item === null) {
      edgeList.push(null);
      continue;
    }
    if (!isObject(item) || typeof item.source !== "number" || typeof item.target !== "number") {
      return failure("Ребро № " + (i + 1) + " без числовых source и target.");
    }
    edgeList.push({
      source: item.source,
      target: item.target,
      weight: typeof item.weight === "number" ? item.weight : null,
      label: typeof item.label === "string" ? item.label : null,
      color: typeof item.color === "string" ? item.color : null,
    });
  }

  const imported = fromBackendGraph({
    isDirect: data.isDirect === true,
    name: typeof data.name === "string" ? data.name : null,
    vertexList: vertexList,
    edgeList: edgeList,
  });
  return { ok: true, graph: imported.graph, skippedEdges: imported.skippedEdges };
}
