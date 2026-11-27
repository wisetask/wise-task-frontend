import type { Graph } from "@/entities/graph";

export function degreeMap(graph: Graph): Record<string, number> {
  const degrees: Record<string, number> = {};
  for (const vertex of graph.vertices) {
    degrees[vertex.id] = 0;
  }
  for (const edge of graph.edges) {
    degrees[edge.source] = (degrees[edge.source] ?? 0) + 1;
    degrees[edge.target] = (degrees[edge.target] ?? 0) + 1;
  }
  return degrees;
}
