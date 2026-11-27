import type { Graph, Vertex } from "@/entities/graph";
import type { Point } from "./geometry";
import type { Viewport } from "./viewport";

export function easeOutCubic(t: number): number {
  const rest = 1 - t;
  return 1 - rest * rest * rest;
}

export function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const rest = -2 * t + 2;
  return 1 - (rest * rest * rest) / 2;
}

function mix(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function blendViewport(from: Viewport, to: Viewport, t: number): Viewport {
  return {
    x: mix(from.x, to.x, t),
    y: mix(from.y, to.y, t),
    scale: mix(from.scale, to.scale, t),
  };
}

function placedVertex(vertex: Vertex, x: number, y: number): Vertex {
  return {
    id: vertex.id,
    label: vertex.label,
    x: x,
    y: y,
    color: vertex.color,
    weight: vertex.weight,
  };
}

function withVertices(graph: Graph, vertices: Vertex[]): Graph {
  return {
    name: graph.name,
    isDirected: graph.isDirected,
    vertices: vertices,
    edges: graph.edges,
  };
}

export function blendGraph(from: Graph, to: Graph, t: number): Graph {
  const start: Record<string, Point> = {};
  for (const vertex of from.vertices) {
    start[vertex.id] = { x: vertex.x, y: vertex.y };
  }
  const vertices: Vertex[] = [];
  for (const vertex of to.vertices) {
    const point = start[vertex.id];
    if (point === undefined) {
      vertices.push(vertex);
    } else {
      vertices.push(placedVertex(vertex, mix(point.x, vertex.x, t), mix(point.y, vertex.y, t)));
    }
  }
  return withVertices(to, vertices);
}

export function orbitGraph(
  graph: Graph,
  centerId: string,
  leafIds: string[],
  angle: number,
): Graph {
  let center: Vertex | null = null;
  for (const vertex of graph.vertices) {
    if (vertex.id === centerId) {
      center = vertex;
    }
  }
  if (center === null) {
    return graph;
  }
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const vertices: Vertex[] = [];
  for (const vertex of graph.vertices) {
    if (!leafIds.includes(vertex.id)) {
      vertices.push(vertex);
      continue;
    }
    const dx = vertex.x - center.x;
    const dy = vertex.y - center.y;
    const x = center.x + dx * cos - dy * sin;
    const y = center.y + dx * sin + dy * cos;
    vertices.push(placedVertex(vertex, x, y));
  }
  return withVertices(graph, vertices);
}

export function fallGraph(graph: Graph, t: number, height: number): Graph {
  const vertices: Vertex[] = [];
  for (let i = 0; i < graph.vertices.length; i++) {
    const vertex = graph.vertices[i];
    const speed = 1 + (i % 5) * 0.15;
    const drift = ((i % 3) - 1) * 30 * t;
    vertices.push(placedVertex(vertex, vertex.x + drift, vertex.y + height * speed * t * t));
  }
  return withVertices(graph, vertices);
}

export function sharesMostVertices(before: Graph, now: Graph): boolean {
  const total = Math.max(before.vertices.length, now.vertices.length);
  if (total === 0) {
    return true;
  }
  const oldIds: Record<string, boolean> = {};
  for (const vertex of before.vertices) {
    oldIds[vertex.id] = true;
  }
  let shared = 0;
  for (const vertex of now.vertices) {
    if (oldIds[vertex.id]) {
      shared = shared + 1;
    }
  }
  return shared * 2 >= total;
}
