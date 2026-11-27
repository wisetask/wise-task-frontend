import type { Graph, GraphColor, Vertex } from "@/entities/graph";

export type DiffState = "same" | "added" | "removed" | "recolored";

export interface DiffVertex {
  key: string;
  x: number;
  y: number;
  label: string;
  color: GraphColor;
  state: DiffState;
}

export interface DiffEdge {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  state: DiffState;
}

export interface DiffCounts {
  addedVertices: number;
  removedVertices: number;
  recoloredVertices: number;
  addedEdges: number;
  removedEdges: number;
}

export interface GraphDiff {
  vertices: DiffVertex[];
  edges: DiffEdge[];
  counts: DiffCounts;
  isDirected: boolean;
}

function labelOf(vertex: Vertex): string {
  return vertex.label.trim();
}

function labelsById(graph: Graph): Record<string, string> {
  const result: Record<string, string> = {};
  for (const vertex of graph.vertices) {
    result[vertex.id] = labelOf(vertex);
  }
  return result;
}

function edgeKey(source: string, target: string, isDirected: boolean): string {
  if (isDirected || source < target) {
    return source + "→" + target;
  }
  return target + "→" + source;
}

function edgeKeys(graph: Graph, isDirected: boolean): Record<string, boolean> {
  const labels = labelsById(graph);
  const keys: Record<string, boolean> = {};
  for (const edge of graph.edges) {
    keys[edgeKey(labels[edge.source], labels[edge.target], isDirected)] = true;
  }
  return keys;
}

export function graphDiff(task: Graph, answer: Graph): GraphDiff {
  const isDirected = answer.isDirected;
  const counts: DiffCounts = {
    addedVertices: 0,
    removedVertices: 0,
    recoloredVertices: 0,
    addedEdges: 0,
    removedEdges: 0,
  };
  const taskByLabel: Record<string, Vertex> = {};
  for (const vertex of task.vertices) {
    taskByLabel[labelOf(vertex)] = vertex;
  }
  const places: Record<string, { x: number; y: number }> = {};
  const vertices: DiffVertex[] = [];
  for (const vertex of answer.vertices) {
    const label = labelOf(vertex);
    const before = taskByLabel[label];
    let state: DiffState = "same";
    if (before === undefined) {
      state = "added";
      counts.addedVertices = counts.addedVertices + 1;
    } else if (before.color !== vertex.color) {
      state = "recolored";
      counts.recoloredVertices = counts.recoloredVertices + 1;
    }
    places[label] = { x: vertex.x, y: vertex.y };
    vertices.push({
      key: "a-" + vertex.id,
      x: vertex.x,
      y: vertex.y,
      label: vertex.label,
      color: vertex.color,
      state: state,
    });
  }
  for (const vertex of task.vertices) {
    const label = labelOf(vertex);
    if (places[label] !== undefined) {
      continue;
    }
    places[label] = { x: vertex.x, y: vertex.y };
    counts.removedVertices = counts.removedVertices + 1;
    vertices.push({
      key: "t-" + vertex.id,
      x: vertex.x,
      y: vertex.y,
      label: vertex.label,
      color: vertex.color,
      state: "removed",
    });
  }

  const edges: DiffEdge[] = [];
  const taskKeys = edgeKeys(task, isDirected);
  const answerKeys = edgeKeys(answer, isDirected);
  const answerLabels = labelsById(answer);
  for (const edge of answer.edges) {
    const from = answerLabels[edge.source];
    const to = answerLabels[edge.target];
    if (places[from] === undefined || places[to] === undefined) {
      continue;
    }
    const known = taskKeys[edgeKey(from, to, isDirected)] === true;
    if (!known) {
      counts.addedEdges = counts.addedEdges + 1;
    }
    edges.push({
      key: "a-" + edge.id,
      x1: places[from].x,
      y1: places[from].y,
      x2: places[to].x,
      y2: places[to].y,
      state: known ? "same" : "added",
    });
  }
  const taskLabels = labelsById(task);
  for (const edge of task.edges) {
    const from = taskLabels[edge.source];
    const to = taskLabels[edge.target];
    if (places[from] === undefined || places[to] === undefined) {
      continue;
    }
    if (answerKeys[edgeKey(from, to, isDirected)] === true) {
      continue;
    }
    counts.removedEdges = counts.removedEdges + 1;
    edges.push({
      key: "t-" + edge.id,
      x1: places[from].x,
      y1: places[from].y,
      x2: places[to].x,
      y2: places[to].y,
      state: "removed",
    });
  }
  return { vertices: vertices, edges: edges, counts: counts, isDirected: isDirected };
}

function plural(count: number, one: string, few: string, many: string): string {
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

function partText(vertices: number, edges: number): string {
  const parts: string[] = [];
  if (vertices > 0) {
    parts.push(vertices + " " + plural(vertices, "вершина", "вершины", "вершин"));
  }
  if (edges > 0) {
    parts.push(edges + " " + plural(edges, "ребро", "ребра", "рёбер"));
  }
  return parts.join(" и ");
}

export function diffSummary(counts: DiffCounts): string[] {
  const lines: string[] = [];
  const added = partText(counts.addedVertices, counts.addedEdges);
  if (added !== "") {
    lines.push("Добавлено: " + added);
  }
  const removed = partText(counts.removedVertices, counts.removedEdges);
  if (removed !== "") {
    lines.push("Удалено: " + removed);
  }
  if (counts.recoloredVertices > 0) {
    lines.push(
      "Перекрашено: " +
        counts.recoloredVertices +
        " " +
        plural(counts.recoloredVertices, "вершина", "вершины", "вершин"),
    );
  }
  if (lines.length === 0) {
    lines.push("Граф задачи не менялся");
  }
  return lines;
}

export interface AttemptPlace {
  index: number;
  total: number;
  previous: string | null;
  next: string | null;
}

export function attemptPlace(ids: string[], currentId: string): AttemptPlace | null {
  const index = ids.indexOf(currentId);
  if (index === -1) {
    return null;
  }
  return {
    index: index,
    total: ids.length,
    previous: index > 0 ? ids[index - 1] : null,
    next: index < ids.length - 1 ? ids[index + 1] : null,
  };
}
