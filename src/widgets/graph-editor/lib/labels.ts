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
