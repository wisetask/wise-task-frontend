import { findVertex, hasEdge, type Graph, type GraphColor } from "@/entities/graph";
import { edgeText } from "./labels";

export const VERTEX_RADIUS = 18;
export const CURVE_BEND = 28;

export interface Point {
  x: number;
  y: number;
}

export interface EdgeShape {
  id: string;
  path: string;
  color: GraphColor;
  text: string;
  labelX: number;
  labelY: number;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatPoint(point: Point): string {
  return round(point.x) + " " + round(point.y);
}

function distance(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function stepTowards(from: Point, to: Point, length: number): Point {
  const total = distance(from, to);
  if (total === 0) {
    return { x: from.x, y: from.y };
  }
  return {
    x: from.x + ((to.x - from.x) / total) * length,
    y: from.y + ((to.y - from.y) / total) * length,
  };
}

function curveControl(source: Point, target: Point, bend: number): Point {
  const length = distance(source, target);
  const normalX = -(target.y - source.y) / length;
  const normalY = (target.x - source.x) / length;
  return {
    x: (source.x + target.x) / 2 + normalX * bend,
    y: (source.y + target.y) / 2 + normalY * bend,
  };
}

export function straightEdgePath(source: Point, target: Point, radius: number): string {
  if (distance(source, target) <= radius * 2) {
    return "";
  }
  const start = stepTowards(source, target, radius);
  const end = stepTowards(target, source, radius);
  return "M " + formatPoint(start) + " L " + formatPoint(end);
}

export function curvedEdgePath(source: Point, target: Point, radius: number, bend: number): string {
  if (distance(source, target) <= radius * 2) {
    return "";
  }
  const control = curveControl(source, target, bend);
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

export function straightLabelPoint(source: Point, target: Point): Point {
  return {
    x: round((source.x + target.x) / 2),
    y: round((source.y + target.y) / 2),
  };
}

export function curvedLabelPoint(source: Point, target: Point, bend: number): Point {
  const control = curveControl(source, target, bend);
  return {
    x: round(0.25 * source.x + 0.5 * control.x + 0.25 * target.x),
    y: round(0.25 * source.y + 0.5 * control.y + 0.25 * target.y),
  };
}

export function loopLabelPoint(center: Point, radius: number): Point {
  return {
    x: round(center.x),
    y: round(center.y - radius * 2.6 - 8),
  };
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
    let labelPoint: Point;
    if (source.id === target.id) {
      path = loopPath(source, radius);
      labelPoint = loopLabelPoint(source, radius);
    } else if (graph.isDirected && hasEdge(graph, target.id, source.id)) {
      path = curvedEdgePath(source, target, radius, CURVE_BEND);
      labelPoint = curvedLabelPoint(source, target, CURVE_BEND);
    } else {
      path = straightEdgePath(source, target, radius);
      labelPoint = straightLabelPoint(source, target);
    }
    if (path !== "") {
      shapes.push({
        id: edge.id,
        path: path,
        color: edge.color,
        text: edgeText(edge),
        labelX: labelPoint.x,
        labelY: labelPoint.y,
      });
    }
  }
  return shapes;
}
