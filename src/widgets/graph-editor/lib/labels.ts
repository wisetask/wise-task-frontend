import { findVertex, type Edge, type Graph } from "@/entities/graph";

export function edgeText(edge: Edge): string {
  if (edge.label !== "" && edge.weight !== 0) {
    return edge.label + " · " + edge.weight;
  }
  if (edge.label !== "") {
    return edge.label;
  }
  if (edge.weight !== 0) {
    return String(edge.weight);
  }
  return "";
}

export function describeEdge(graph: Graph, edge: Edge): string {
  const source = findVertex(graph, edge.source);
  const target = findVertex(graph, edge.target);
  const sourceLabel = source ? source.label : "?";
  const targetLabel = target ? target.label : "?";
  const arrow = graph.isDirected ? " → " : " — ";
  return "Ребро " + sourceLabel + arrow + targetLabel;
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return many;
  }
  if (last === 1) {
    return one;
  }
  if (last >= 2 && last <= 4) {
    return few;
  }
  return many;
}

export function describeGroup(vertexCount: number, edgeCount: number): string {
  const parts: string[] = [];
  if (vertexCount > 0) {
    parts.push(vertexCount + " " + pluralize(vertexCount, "вершина", "вершины", "вершин"));
  }
  if (edgeCount > 0) {
    parts.push(edgeCount + " " + pluralize(edgeCount, "ребро", "ребра", "рёбер"));
  }
  return "Выбрано: " + parts.join(", ");
}
