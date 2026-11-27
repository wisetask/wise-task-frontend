import {
  findVertex,
  graphNeighbors,
  vertexDegree,
  type Graph,
  type Vertex,
} from "@/entities/graph";
import { edgeText, pluralize } from "@/widgets/graph-editor";

export const PREVIEW_RADIUS = 18;
export const PREVIEW_PADDING = 44;
export const PREVIEW_MIN_WIDTH = 260;
export const PREVIEW_MIN_HEIGHT = 170;
export const CURVE_SHIFT = 26;

export interface PreviewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreviewEdge {
  id: string;
  source: string;
  target: string;
  path: string;
  text: string;
  textX: number;
  textY: number;
}

export function previewBox(graph: Graph): PreviewBox {
  if (graph.vertices.length === 0) {
    return { x: 0, y: 0, width: PREVIEW_MIN_WIDTH, height: PREVIEW_MIN_HEIGHT };
  }
  let left = graph.vertices[0].x;
  let right = left;
  let top = graph.vertices[0].y;
  let bottom = top;
  for (const vertex of graph.vertices) {
    left = Math.min(left, vertex.x);
    right = Math.max(right, vertex.x);
    top = Math.min(top, vertex.y);
    bottom = Math.max(bottom, vertex.y);
  }
  const width = Math.max(right - left + PREVIEW_PADDING * 2, PREVIEW_MIN_WIDTH);
  const height = Math.max(bottom - top + PREVIEW_PADDING * 2, PREVIEW_MIN_HEIGHT);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  return {
    x: Math.round(centerX - width / 2),
    y: Math.round(centerY - height / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function loopPath(vertex: Vertex): string {
  const x = vertex.x;
  const y = vertex.y - PREVIEW_RADIUS + 2;
  return (
    "M" +
    round(x - 9) +
    " " +
    round(y) +
    " C" +
    round(x - 34) +
    " " +
    round(y - 48) +
    " " +
    round(x + 34) +
    " " +
    round(y - 48) +
    " " +
    round(x + 9) +
    " " +
    round(y)
  );
}

export function previewEdges(graph: Graph): PreviewEdge[] {
  const pairs: Record<string, boolean> = {};
  for (const edge of graph.edges) {
    pairs[edge.source + ">" + edge.target] = true;
  }
  const result: PreviewEdge[] = [];
  for (const edge of graph.edges) {
    const source = findVertex(graph, edge.source);
    const target = findVertex(graph, edge.target);
    if (!source || !target) {
      continue;
    }
    const text = edgeText(edge);
    if (source.id === target.id) {
      result.push({
        id: edge.id,
        source: source.id,
        target: target.id,
        path: loopPath(source),
        text: text,
        textX: source.x,
        textY: source.y - PREVIEW_RADIUS - 40,
      });
      continue;
    }
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const normalX = -dy / length;
    const normalY = dx / length;
    let shift = 0;
    if (graph.isDirected && pairs[edge.target + ">" + edge.source]) {
      shift = CURVE_SHIFT;
    }
    const middleX = (source.x + target.x) / 2 + normalX * shift;
    const middleY = (source.y + target.y) / 2 + normalY * shift;
    let endX = target.x;
    let endY = target.y;
    if (graph.isDirected) {
      const toEndX = target.x - middleX;
      const toEndY = target.y - middleY;
      const toEndLength = Math.max(Math.sqrt(toEndX * toEndX + toEndY * toEndY), 1);
      endX = target.x - (toEndX / toEndLength) * (PREVIEW_RADIUS + 3);
      endY = target.y - (toEndY / toEndLength) * (PREVIEW_RADIUS + 3);
    }
    let path = "M" + round(source.x) + " " + round(source.y);
    if (shift === 0) {
      path = path + " L" + round(endX) + " " + round(endY);
    } else {
      const controlX = middleX * 2 - (source.x + target.x) / 2;
      const controlY = middleY * 2 - (source.y + target.y) / 2;
      path =
        path +
        " Q" +
        round(controlX) +
        " " +
        round(controlY) +
        " " +
        round(endX) +
        " " +
        round(endY);
    }
    result.push({
      id: edge.id,
      source: source.id,
      target: target.id,
      path: path,
      text: text,
      textX: round(middleX),
      textY: round(middleY),
    });
  }
  return result;
}

export function graphSummary(graph: Graph): string[] {
  const vertices = graph.vertices.length;
  const edges = graph.edges.length;
  const result = [
    vertices + " " + pluralize(vertices, "вершина", "вершины", "вершин"),
    edges + " " + pluralize(edges, "ребро", "ребра", "рёбер"),
    graph.isDirected ? "ориентированный" : "неориентированный",
  ];
  for (const edge of graph.edges) {
    if (edge.weight !== 0) {
      result.push("взвешенный");
      break;
    }
  }
  return result;
}

export function closeIds(graph: Graph, vertexId: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  result[vertexId] = true;
  const neighbors = graphNeighbors(graph).get(vertexId) ?? [];
  for (const id of neighbors) {
    result[id] = true;
  }
  return result;
}

export function vertexCaption(graph: Graph, vertexId: string): string {
  const vertex = findVertex(graph, vertexId);
  if (!vertex) {
    return "";
  }
  const degree = vertexDegree(graph, vertexId);
  const neighbors = graphNeighbors(graph).get(vertexId) ?? [];
  const labels: string[] = [];
  const known: Record<string, boolean> = {};
  for (const id of neighbors) {
    const neighbor = findVertex(graph, id);
    if (neighbor && id !== vertexId && !known[id]) {
      known[id] = true;
      labels.push(neighbor.label === "" ? "?" : neighbor.label);
    }
  }
  let text =
    "Вершина " + (vertex.label === "" ? "без имени" : vertex.label) + ": степень " + degree;
  if (labels.length === 0) {
    return text + ", соседей нет";
  }
  text = text + ", соседи " + labels.join(", ");
  return text;
}

export function popDelay(index: number): string {
  return Math.min(index * 45, 900) + 200 + "ms";
}

export function drawDelay(index: number): string {
  return Math.min(index * 35, 700) + "ms";
}
