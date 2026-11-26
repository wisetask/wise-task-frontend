import type { Graph } from "@/entities/graph";
import type { EditorTool } from "./selection";

export interface LitParts {
  vertexIds: string[];
  edgeIds: string[];
}

export function litParts(graph: Graph, vertexId: string | null): LitParts {
  const result: LitParts = { vertexIds: [], edgeIds: [] };
  if (vertexId === null) {
    return result;
  }
  for (const edge of graph.edges) {
    if (edge.source !== vertexId && edge.target !== vertexId) {
      continue;
    }
    result.edgeIds.push(edge.id);
    let neighbor: string = edge.source;
    if (edge.source === vertexId) {
      neighbor = edge.target;
    }
    if (neighbor !== vertexId && !result.vertexIds.includes(neighbor)) {
      result.vertexIds.push(neighbor);
    }
  }
  return result;
}

export function emptyCanvasText(readonly: boolean, tool: EditorTool, canAdd: boolean): string {
  if (readonly || !canAdd) {
    return "Граф пока пуст";
  }
  if (tool === "vertex") {
    return "Кликните в любом месте, и появится первая вершина";
  }
  return "Нажмите 2 и кликните по холсту, чтобы поставить вершину";
}
