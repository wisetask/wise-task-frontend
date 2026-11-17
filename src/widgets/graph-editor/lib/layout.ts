import type { Graph, Vertex } from "@/entities/graph";
import type { Point } from "./geometry";
import { pointsArea } from "./viewport";

export type LayoutKind = "circle" | "grid" | "levels" | "bipartite";

export const LAYOUT_STEP = 100;
const MIN_RADIUS = 120;
const PART_GAP = 300;

function centerOf(graph: Graph): Point {
  const area = pointsArea(graph.vertices);
  if (area === null) {
    return { x: 0, y: 0 };
  }
  return { x: (area.left + area.right) / 2, y: (area.top + area.bottom) / 2 };
}

function placeVertices(graph: Graph, positions: Map<string, Point>): Graph {
  const vertices: Vertex[] = [];
  for (const vertex of graph.vertices) {
    const position = positions.get(vertex.id);
    if (position === undefined) {
      vertices.push(vertex);
    } else {
      vertices.push({
        id: vertex.id,
        label: vertex.label,
        x: Math.round(position.x),
        y: Math.round(position.y),
        color: vertex.color,
        weight: vertex.weight,
      });
    }
  }
  return {
    name: graph.name,
    isDirected: graph.isDirected,
    vertices: vertices,
    edges: graph.edges,
  };
}

function neighbours(graph: Graph): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const vertex of graph.vertices) {
    result.set(vertex.id, []);
  }
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }
    const fromSource = result.get(edge.source);
    const fromTarget = result.get(edge.target);
    if (fromSource !== undefined && fromTarget !== undefined) {
      fromSource.push(edge.target);
      fromTarget.push(edge.source);
    }
  }
  return result;
}

export function circlePositions(graph: Graph): Map<string, Point> {
  const positions = new Map<string, Point>();
  const center = centerOf(graph);
  const count = graph.vertices.length;
  if (count === 1) {
    positions.set(graph.vertices[0].id, center);
    return positions;
  }
  const radius = Math.max(MIN_RADIUS, (LAYOUT_STEP * count) / (2 * Math.PI));
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    positions.set(graph.vertices[i].id, {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return positions;
}

export function gridPositions(graph: Graph): Map<string, Point> {
  const positions = new Map<string, Point>();
  const center = centerOf(graph);
  const count = graph.vertices.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const left = center.x - ((columns - 1) * LAYOUT_STEP) / 2;
  const top = center.y - ((rows - 1) * LAYOUT_STEP) / 2;
  for (let i = 0; i < count; i++) {
    positions.set(graph.vertices[i].id, {
      x: left + (i % columns) * LAYOUT_STEP,
      y: top + Math.floor(i / columns) * LAYOUT_STEP,
    });
  }
  return positions;
}

function firstRoot(graph: Graph, rootId: string | null): string {
  if (rootId !== null) {
    for (const vertex of graph.vertices) {
      if (vertex.id === rootId) {
        return rootId;
      }
    }
  }
  if (graph.isDirected) {
    for (const vertex of graph.vertices) {
      let hasIncoming = false;
      for (const edge of graph.edges) {
        if (edge.target === vertex.id && edge.source !== vertex.id) {
          hasIncoming = true;
        }
      }
      if (!hasIncoming) {
        return vertex.id;
      }
    }
  }
  return graph.vertices[0].id;
}

export function treeLevels(graph: Graph, rootId: string | null): string[][][] {
  const components: string[][][] = [];
  if (graph.vertices.length === 0) {
    return components;
  }
  const near = neighbours(graph);
  const visited: string[] = [];
  const roots = [firstRoot(graph, rootId)];
  for (const vertex of graph.vertices) {
    roots.push(vertex.id);
  }
  for (const root of roots) {
    if (visited.includes(root)) {
      continue;
    }
    const levels: string[][] = [];
    let level = [root];
    visited.push(root);
    while (level.length > 0) {
      levels.push(level);
      const next: string[] = [];
      for (const id of level) {
        for (const other of near.get(id) || []) {
          if (!visited.includes(other)) {
            visited.push(other);
            next.push(other);
          }
        }
      }
      level = next;
    }
    components.push(levels);
  }
  return components;
}

export function levelPositions(graph: Graph, rootId: string | null): Map<string, Point> {
  const positions = new Map<string, Point>();
  const components = treeLevels(graph, rootId);
  let totalWidth = 0;
  let totalHeight = 0;
  for (const levels of components) {
    let widest = 0;
    for (const level of levels) {
      widest = Math.max(widest, level.length);
    }
    totalWidth = totalWidth + widest * LAYOUT_STEP;
    totalHeight = Math.max(totalHeight, (levels.length - 1) * LAYOUT_STEP);
  }
  const center = centerOf(graph);
  let componentLeft = center.x - totalWidth / 2;
  const top = center.y - totalHeight / 2;
  for (const levels of components) {
    let widest = 0;
    for (const level of levels) {
      widest = Math.max(widest, level.length);
    }
    const componentCenter = componentLeft + (widest * LAYOUT_STEP) / 2;
    for (let depth = 0; depth < levels.length; depth++) {
      const level = levels[depth];
      const left = componentCenter - ((level.length - 1) * LAYOUT_STEP) / 2;
      for (let i = 0; i < level.length; i++) {
        positions.set(level[i], { x: left + i * LAYOUT_STEP, y: top + depth * LAYOUT_STEP });
      }
    }
    componentLeft = componentLeft + widest * LAYOUT_STEP;
  }
  return positions;
}

export function twoParts(graph: Graph): string[][] | null {
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      return null;
    }
  }
  const near = neighbours(graph);
  const side = new Map<string, number>();
  for (const vertex of graph.vertices) {
    if (side.has(vertex.id)) {
      continue;
    }
    side.set(vertex.id, 0);
    const queue = [vertex.id];
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) {
        break;
      }
      const mySide = side.get(id);
      for (const other of near.get(id) || []) {
        const otherSide = side.get(other);
        if (otherSide === undefined) {
          side.set(other, mySide === 0 ? 1 : 0);
          queue.push(other);
        } else if (otherSide === mySide) {
          return null;
        }
      }
    }
  }
  const left: string[] = [];
  const right: string[] = [];
  for (const vertex of graph.vertices) {
    if (side.get(vertex.id) === 0) {
      left.push(vertex.id);
    } else {
      right.push(vertex.id);
    }
  }
  return [left, right];
}

export function bipartitePositions(graph: Graph): Map<string, Point> | null {
  const parts = twoParts(graph);
  if (parts === null) {
    return null;
  }
  const positions = new Map<string, Point>();
  const center = centerOf(graph);
  for (let column = 0; column < 2; column++) {
    const part = parts[column];
    const x = center.x + (column === 0 ? -PART_GAP / 2 : PART_GAP / 2);
    const top = center.y - ((part.length - 1) * LAYOUT_STEP) / 2;
    for (let i = 0; i < part.length; i++) {
      positions.set(part[i], { x: x, y: top + i * LAYOUT_STEP });
    }
  }
  return positions;
}

export function canLayout(graph: Graph, kind: LayoutKind): boolean {
  if (graph.vertices.length < 2) {
    return false;
  }
  if (kind === "bipartite") {
    return twoParts(graph) !== null;
  }
  return true;
}

export function layoutGraph(graph: Graph, kind: LayoutKind, rootId: string | null): Graph {
  if (!canLayout(graph, kind)) {
    return graph;
  }
  if (kind === "circle") {
    return placeVertices(graph, circlePositions(graph));
  }
  if (kind === "grid") {
    return placeVertices(graph, gridPositions(graph));
  }
  if (kind === "levels") {
    return placeVertices(graph, levelPositions(graph, rootId));
  }
  const positions = bipartitePositions(graph);
  if (positions === null) {
    return graph;
  }
  return placeVertices(graph, positions);
}
