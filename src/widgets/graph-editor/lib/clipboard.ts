import { nextVertexLabel, type Edge, type Graph, type Vertex } from "@/entities/graph";
import { createId } from "@/shared/lib/createId";
import { makeSelection, selectedIds, type GraphSelection } from "./selection";

export interface GraphClipboard {
  vertices: Vertex[];
  edges: Edge[];
}

export interface PasteResult {
  graph: Graph;
  selection: GraphSelection | null;
}

const NUMBER_LABEL = /^\d+$/;

export function copySelection(
  graph: Graph,
  selection: GraphSelection | null,
): GraphClipboard | null {
  const ids = selectedIds(selection);
  const vertices: Vertex[] = [];
  for (const vertex of graph.vertices) {
    if (ids.vertexIds.includes(vertex.id)) {
      vertices.push(vertex);
    }
  }
  if (vertices.length === 0) {
    return null;
  }
  const edges: Edge[] = [];
  for (const edge of graph.edges) {
    if (ids.vertexIds.includes(edge.source) && ids.vertexIds.includes(edge.target)) {
      edges.push(edge);
    }
  }
  return { vertices: vertices, edges: edges };
}

export function pasteClipboard(
  graph: Graph,
  clipboard: GraphClipboard,
  offset: number,
): PasteResult {
  const newIds = new Map<string, string>();
  let nextNumber = Number(nextVertexLabel(graph));
  const vertices: Vertex[] = [];
  for (const vertex of clipboard.vertices) {
    const id = createId();
    newIds.set(vertex.id, id);
    let label = vertex.label;
    if (NUMBER_LABEL.test(vertex.label)) {
      label = String(nextNumber);
      nextNumber = nextNumber + 1;
    }
    vertices.push({
      id: id,
      label: label,
      x: vertex.x + offset,
      y: vertex.y + offset,
      color: vertex.color,
      weight: vertex.weight,
    });
  }

  const edges: Edge[] = [];
  for (const edge of clipboard.edges) {
    const source = newIds.get(edge.source);
    const target = newIds.get(edge.target);
    if (source === undefined || target === undefined) {
      continue;
    }
    edges.push({
      id: createId(),
      source: source,
      target: target,
      label: edge.label,
      color: edge.color,
      weight: edge.weight,
    });
  }

  const newGraph: Graph = {
    name: graph.name,
    isDirected: graph.isDirected,
    vertices: graph.vertices.concat(vertices),
    edges: graph.edges.concat(edges),
  };
  const selection = makeSelection(
    vertices.map((vertex) => vertex.id),
    edges.map((edge) => edge.id),
  );
  return { graph: newGraph, selection: selection };
}
