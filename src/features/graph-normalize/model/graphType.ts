import { graphNeighbors, splitIntoComponents, type Graph } from "@/entities/graph";

export type GraphType = "chain" | "cycle" | "star" | "tree" | "bipartite" | "nearlyFull" | "other";

function isSimpleConnected(graph: Graph): boolean {
  if (graph.vertices.length === 0 || splitIntoComponents(graph).length !== 1) return false;
  for (const edge of graph.edges) {
    if (edge.source === edge.target) return false;
  }
  return true;
}

function edgeCount(graph: Graph): number {
  let count = 0;
  for (const neighbors of graphNeighbors(graph).values()) count += neighbors.length;
  return count / 2;
}

export function isTree(graph: Graph): boolean {
  return isSimpleConnected(graph) && edgeCount(graph) === graph.vertices.length - 1;
}

export function isChain(graph: Graph): boolean {
  if (!isTree(graph)) return false;
  for (const neighbors of graphNeighbors(graph).values()) {
    if (neighbors.length > 2) return false;
  }
  return true;
}

export function isCycle(graph: Graph): boolean {
  if (!isSimpleConnected(graph) || graph.vertices.length < 3) return false;
  for (const neighbors of graphNeighbors(graph).values()) {
    if (neighbors.length !== 2) return false;
  }
  return true;
}

export function isStar(graph: Graph): boolean {
  if (!isTree(graph) || graph.vertices.length < 3) return false;
  for (const neighbors of graphNeighbors(graph).values()) {
    if (neighbors.length === graph.vertices.length - 1) return true;
  }
  return false;
}

// undefined означает конфликт цветов (в том числе петлю).
export function bipartiteColors(graph: Graph): Map<string, number> | undefined {
  const neighbors = graphNeighbors(graph);
  const colors = new Map<string, number>();
  for (const vertex of graph.vertices) {
    if (colors.has(vertex.id)) continue;
    colors.set(vertex.id, 0);
    const queue = [vertex.id];
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      for (const next of neighbors.get(current) ?? []) {
        if (colors.get(next) === colors.get(current)) return undefined;
        if (!colors.has(next)) {
          colors.set(next, 1 - colors.get(current)!);
          queue.push(next);
        }
      }
    }
  }
  return colors;
}

export function isBipartite(graph: Graph): boolean {
  return graph.vertices.length > 0 && bipartiteColors(graph) !== undefined;
}

export function isNearlyFull(graph: Graph): boolean {
  const n = graph.vertices.length;
  return n > 1 && isSimpleConnected(graph) && edgeCount(graph) / ((n * (n - 1)) / 2) >= 0.7;
}

export function detectType(graph: Graph): GraphType {
  if (isChain(graph)) return "chain";
  if (isCycle(graph)) return "cycle";
  if (isStar(graph)) return "star";
  if (isTree(graph)) return "tree";
  if (isBipartite(graph)) return "bipartite";
  if (isNearlyFull(graph)) return "nearlyFull";
  return "other";
}
