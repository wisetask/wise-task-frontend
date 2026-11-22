import { graphNeighbors, type Graph } from "@/entities/graph";
import { bipartiteColors, detectType } from "./graphType";

const SPACING = 100;
type Position = { x: number; y: number };

function withPositions(graph: Graph, positions: Map<string, Position>): Graph {
  return {
    ...graph,
    vertices: graph.vertices.map((vertex) => ({ ...vertex, ...positions.get(vertex.id) })),
  };
}

export function layoutCircle(graph: Graph): Graph {
  const positions = new Map<string, Position>();
  const n = graph.vertices.length;
  const radius = n > 1 ? SPACING / (2 * Math.sin(Math.PI / n)) : 0;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.set(graph.vertices[i].id, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }
  return withPositions(graph, positions);
}

export function layoutChain(graph: Graph): Graph {
  const neighbors = graphNeighbors(graph);
  const start = graph.vertices.find((vertex) => neighbors.get(vertex.id)!.length <= 1);
  if (!start) {
    return layoutCircle(graph);
  }
  const positions = new Map<string, Position>();
  const queue = [start.id];
  positions.set(start.id, { x: 0, y: 0 });
  for (let head = 0; head < queue.length; head++) {
    for (const next of neighbors.get(queue[head]) ?? []) {
      if (positions.has(next)) {
        continue;
      }
      positions.set(next, { x: positions.size * SPACING, y: 0 });
      queue.push(next);
    }
  }
  return withPositions(graph, positions);
}

export function layoutCycle(graph: Graph): Graph {
  const neighbors = graphNeighbors(graph);
  const ordered = [];
  const visited = new Set<string>();
  let current: string | undefined = graph.vertices[0]?.id;
  while (current !== undefined && !visited.has(current)) {
    visited.add(current);
    ordered.push(graph.vertices.find((vertex) => vertex.id === current)!);
    current = neighbors.get(current)?.find((next) => !visited.has(next));
  }
  const circle = layoutCircle({ ...graph, vertices: ordered });
  const positions = new Map<string, Position>();
  for (const vertex of circle.vertices) positions.set(vertex.id, vertex);
  return withPositions(graph, positions);
}

function rootId(graph: Graph, neighbors: Map<string, string[]>): string | undefined {
  let root = graph.vertices[0]?.id;
  for (const vertex of graph.vertices) {
    if (root !== undefined && neighbors.get(vertex.id)!.length > neighbors.get(root)!.length) {
      root = vertex.id;
    }
  }
  return root;
}

export function layoutStar(graph: Graph): Graph {
  const root = rootId(graph, graphNeighbors(graph));
  const leaves = layoutCircle({
    ...graph,
    vertices: graph.vertices.filter((vertex) => vertex.id !== root),
  });
  const positions = new Map<string, Position>();
  // Маленькая звезда тоже должна оставлять место между центром и листьями.
  for (const vertex of leaves.vertices) {
    const radius = Math.hypot(vertex.x, vertex.y);
    const scale = radius > 0 ? Math.max(1, SPACING / radius) : 1;
    positions.set(vertex.id, { x: vertex.x * scale, y: vertex.y * scale });
  }
  if (root !== undefined) {
    positions.set(root, { x: 0, y: 0 });
  }
  return withPositions(graph, positions);
}

export function layoutTree(graph: Graph, id: string | null = null): Graph {
  const neighbors = graphNeighbors(graph);
  const root =
    id !== null && graph.vertices.some((vertex) => vertex.id === id)
      ? id
      : rootId(graph, neighbors);
  if (root === undefined) {
    return withPositions(graph, new Map());
  }
  const children = new Map<string, string[]>();
  const depths = new Map<string, number>([[root, 0]]);
  const queue = [root];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const list: string[] = [];
    for (const next of neighbors.get(current) ?? []) {
      if (depths.has(next)) {
        continue;
      }
      depths.set(next, depths.get(current)! + 1);
      list.push(next);
      queue.push(next);
    }
    children.set(current, list);
  }
  // Ширина поддерева — сумма ширин детей. Обратный BFS избегает рекурсии.
  const widths = new Map<string, number>();
  for (let i = queue.length - 1; i >= 0; i--) {
    let width = 0;
    for (const child of children.get(queue[i])!) width += widths.get(child)!;
    widths.set(queue[i], Math.max(1, width));
  }
  const lefts = new Map<string, number>([[root, 0]]);
  const positions = new Map<string, Position>();
  for (const current of queue) {
    let left = lefts.get(current)!;
    positions.set(current, {
      x: (left + (widths.get(current)! - 1) / 2) * SPACING,
      y: depths.get(current)! * SPACING,
    });
    for (const child of children.get(current)!) {
      lefts.set(child, left);
      left += widths.get(child)!;
    }
  }
  return withPositions(graph, positions);
}

export function layoutBipartite(graph: Graph): Graph {
  const colors = bipartiteColors(graph);
  if (!colors) {
    return layoutCircle(graph);
  }
  const rows = [0, 0];
  const positions = new Map<string, Position>();
  for (const vertex of graph.vertices) {
    const column = colors.get(vertex.id)!;
    positions.set(vertex.id, { x: column * SPACING * 2, y: rows[column] * SPACING });
    rows[column]++;
  }
  return withPositions(graph, positions);
}

export const layoutNearlyFull = layoutCircle;
export const layoutOther = layoutCircle;

export function layoutComponent(graph: Graph): Graph {
  switch (detectType(graph)) {
    case "chain":
      return layoutChain(graph);
    case "cycle":
      return layoutCycle(graph);
    case "star":
      return layoutStar(graph);
    case "tree":
      return layoutTree(graph);
    case "bipartite":
      return layoutBipartite(graph);
    case "nearlyFull":
      return layoutNearlyFull(graph);
    default:
      return layoutOther(graph);
  }
}
