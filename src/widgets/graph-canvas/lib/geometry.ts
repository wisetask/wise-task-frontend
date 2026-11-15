import { findVertex, hasEdge, type Graph } from "@/entities/graph";

export const VERTEX_RADIUS = 18;
export const CURVE_BEND = 28;

export interface Point {
  x: number;
  y: number;
}

export interface EdgeShape {
  id: string;
  path: string;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatPoint(point: Point): string {
  return round(point.x) + " " + round(point.y);
}

function stepTowards(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    return { x: from.x, y: from.y };
  }
  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance,
  };
}

export function straightEdgePath(source: Point, target: Point, radius: number): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length <= radius * 2) {
    return "";
  }
  const start = stepTowards(source, target, radius);
  const end = stepTowards(target, source, radius);
  return "M " + formatPoint(start) + " L " + formatPoint(end);
}

export function curvedEdgePath(source: Point, target: Point, radius: number, bend: number): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length <= radius * 2) {
    return "";
  }
  const normalX = -dy / length;
  const normalY = dx / length;
  const control = {
    x: (source.x + target.x) / 2 + normalX * bend,
    y: (source.y + target.y) / 2 + normalY * bend,
  };
  const start = stepTowards(source, control, radius);
  const end = stepTowards(target, control, radius);
  return "M " + formatPoint(start) + " Q " + formatPoint(control) + " " + formatPoint(end);
}

export function loopPath(center: Point, radius: number): string {
  const start = {
    x: center.x - radius * 0.5,
    y: center.y - radius * 0.866,
  };
  const end = {
    x: center.x + radius * 0.5,
    y: center.y - radius * 0.866,
  };
  const firstControl = {
    x: center.x - radius * 1.6,
    y: center.y - radius * 3.2,
  };
  const secondControl = {
    x: center.x + radius * 1.6,
    y: center.y - radius * 3.2,
  };
  return (
    "M " +
    formatPoint(start) +
    " C " +
    formatPoint(firstControl) +
    " " +
    formatPoint(secondControl) +
    " " +
    formatPoint(end)
  );
}

export function buildEdgeShapes(graph: Graph, radius: number): EdgeShape[] {
  const shapes: EdgeShape[] = [];
  for (const edge of graph.edges) {
    const source = findVertex(graph, edge.source);
    const target = findVertex(graph, edge.target);
    if (!source || !target) {
      continue;
    }
    let path: string;
    if (source.id === target.id) {
      path = loopPath(source, radius);
    } else if (graph.isDirected && hasEdge(graph, target.id, source.id)) {
      path = curvedEdgePath(source, target, radius, CURVE_BEND);
    } else {
      path = straightEdgePath(source, target, radius);
    }
    if (path !== "") {
      shapes.push({ id: edge.id, path: path });
    }
  }
  return shapes;
}
