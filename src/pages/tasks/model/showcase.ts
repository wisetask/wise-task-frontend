import {
  colorsText,
  LATTICE_COLUMNS,
  greedyColoring,
  neighbourLists,
  paintOrder,
  type PaintPoint,
} from "./coloringBackdrop";

export type ShowcaseKind = "coloring" | "tree" | "matching" | "hamilton";

export const SHOWCASE_ORDER: ShowcaseKind[] = ["coloring", "tree", "matching", "hamilton"];

export const SHOWCASE_SEED = 7;

const VERTEX_STEP = 70;
const EDGE_STEP = 55;

export type EdgeState = "" | "on" | "off";

export interface ShowcaseRun {
  kind: ShowcaseKind;
  caption: string;
  vertexColor: number[];
  vertexDelay: number[];
  vertexTries: number[];
  edgeState: EdgeState[];
  edgeDelay: number[];
  duration: number;
}

function emptyRun(kind: ShowcaseKind, vertexCount: number, edgeCount: number): ShowcaseRun {
  const run: ShowcaseRun = {
    kind: kind,
    caption: "",
    vertexColor: [],
    vertexDelay: [],
    vertexTries: [],
    edgeState: [],
    edgeDelay: [],
    duration: 0,
  };
  for (let index = 0; index < vertexCount; index++) {
    run.vertexColor.push(-1);
    run.vertexDelay.push(0);
    run.vertexTries.push(0);
  }
  for (let index = 0; index < edgeCount; index++) {
    run.edgeState.push("");
    run.edgeDelay.push(0);
  }
  return run;
}

function edgeIndex(edges: number[][], first: number, second: number): number {
  for (let index = 0; index < edges.length; index++) {
    const edge = edges[index];
    if ((edge[0] === first && edge[1] === second) || (edge[0] === second && edge[1] === first)) {
      return index;
    }
  }
  return -1;
}

export function coloringRun(points: PaintPoint[], edges: number[][], start: number): ShowcaseRun {
  const neighbours = neighbourLists(points.length, edges);
  const order = paintOrder(neighbours, start);
  const coloring = greedyColoring(neighbours, order);
  const run = emptyRun("coloring", points.length, edges.length);
  let time = 0;
  for (const vertex of order) {
    run.vertexTries[vertex] = coloring.clashes[vertex];
    run.vertexColor[vertex] = coloring.colors[vertex];
    run.vertexDelay[vertex] = time;
    time = time + VERTEX_STEP;
  }
  run.caption = "Жадная раскраска: " + colorsText(coloring.used) + ", соседи разного цвета";
  run.duration = time;
  return run;
}

function edgeLength(points: PaintPoint[], edge: number[]): number {
  const first = points[edge[0]];
  const second = points[edge[1]];
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function findRoot(parent: number[], vertex: number): number {
  let root = vertex;
  while (parent[root] !== root) {
    root = parent[root];
  }
  return root;
}

export function treeRun(points: PaintPoint[], edges: number[][]): ShowcaseRun {
  const run = emptyRun("tree", points.length, edges.length);
  const sorted: number[] = [];
  for (let index = 0; index < edges.length; index++) {
    sorted.push(index);
  }
  sorted.sort(
    (first, second) => edgeLength(points, edges[first]) - edgeLength(points, edges[second]),
  );
  const parent: number[] = [];
  for (let index = 0; index < points.length; index++) {
    parent.push(index);
  }
  let time = 0;
  let taken = 0;
  for (const index of sorted) {
    if (taken === points.length - 1) {
      break;
    }
    const first = findRoot(parent, edges[index][0]);
    const second = findRoot(parent, edges[index][1]);
    run.edgeDelay[index] = time;
    if (first === second) {
      run.edgeState[index] = "off";
      time = time + EDGE_STEP / 2;
      continue;
    }
    parent[first] = second;
    run.edgeState[index] = "on";
    taken = taken + 1;
    for (const vertex of edges[index]) {
      if (run.vertexColor[vertex] < 0) {
        run.vertexColor[vertex] = 1;
        run.vertexDelay[vertex] = time;
      }
    }
    time = time + EDGE_STEP;
  }
  run.caption =
    "Минимальное остовное дерево: " + taken + " самых коротких рёбер связывают всё без циклов";
  run.duration = time;
  return run;
}

export function matchingRun(points: PaintPoint[], edges: number[][], start: number): ShowcaseRun {
  const neighbours = neighbourLists(points.length, edges);
  const order = paintOrder(neighbours, start);
  const run = emptyRun("matching", points.length, edges.length);
  const matched: boolean[] = [];
  for (let index = 0; index < points.length; index++) {
    matched.push(false);
  }
  let time = 0;
  let pairs = 0;
  for (const vertex of order) {
    if (matched[vertex]) {
      continue;
    }
    let partner = -1;
    for (const next of neighbours[vertex]) {
      if (!matched[next] && partner < 0) {
        partner = next;
      }
    }
    if (partner < 0) {
      continue;
    }
    matched[vertex] = true;
    matched[partner] = true;
    const index = edgeIndex(edges, vertex, partner);
    run.edgeState[index] = "on";
    run.edgeDelay[index] = time;
    run.vertexColor[vertex] = 2;
    run.vertexColor[partner] = 2;
    run.vertexDelay[vertex] = time;
    run.vertexDelay[partner] = time;
    pairs = pairs + 1;
    time = time + VERTEX_STEP * 2;
  }
  run.caption = "Паросочетание: " + pairs + " пар, у каждой вершины не больше одной";
  run.duration = time;
  return run;
}

export function snakeOrder(count: number, columns: number): number[] {
  const order: number[] = [];
  const rows = Math.ceil(count / columns);
  for (let row = 0; row < rows; row++) {
    for (let step = 0; step < columns; step++) {
      const column = row % 2 === 0 ? step : columns - 1 - step;
      const index = row * columns + column;
      if (index < count) {
        order.push(index);
      }
    }
  }
  return order;
}

export function isPath(edges: number[][], order: number[]): boolean {
  for (let index = 1; index < order.length; index++) {
    if (edgeIndex(edges, order[index - 1], order[index]) < 0) {
      return false;
    }
  }
  return true;
}

export function hamiltonRun(points: PaintPoint[], edges: number[][]): ShowcaseRun {
  const run = emptyRun("hamilton", points.length, edges.length);
  const order = snakeOrder(points.length, LATTICE_COLUMNS);
  let time = 0;
  for (let index = 0; index < order.length; index++) {
    run.vertexColor[order[index]] = 0;
    run.vertexDelay[order[index]] = time;
    if (index > 0) {
      const edge = edgeIndex(edges, order[index - 1], order[index]);
      if (edge >= 0) {
        run.edgeState[edge] = "on";
        run.edgeDelay[edge] = time - VERTEX_STEP;
      }
    }
    time = time + VERTEX_STEP;
  }
  run.caption = "Гамильтонов путь: через все " + points.length + " вершин ровно по одному разу";
  run.duration = time;
  return run;
}

export function buildRun(
  kind: ShowcaseKind,
  points: PaintPoint[],
  edges: number[][],
  start: number,
): ShowcaseRun {
  if (kind === "tree") {
    return treeRun(points, edges);
  }
  if (kind === "matching") {
    return matchingRun(points, edges, start);
  }
  if (kind === "hamilton") {
    return hamiltonRun(points, edges);
  }
  return coloringRun(points, edges, start);
}

export function showcaseForCategory(category: string): ShowcaseKind | "" {
  const text = category.toLocaleLowerCase("ru");
  if (text.includes("раскрас") || text.includes("цвет") || text.includes("хроматич")) {
    return "coloring";
  }
  if (text.includes("дерев") || text.includes("остов")) {
    return "tree";
  }
  if (text.includes("паросоч") || text.includes("двудол")) {
    return "matching";
  }
  if (text.includes("гамильт") || text.includes("обход") || text.includes("цикл")) {
    return "hamilton";
  }
  return "";
}

export function nextKind(index: number, category: string): ShowcaseKind {
  const fixed = showcaseForCategory(category);
  if (fixed !== "") {
    return fixed;
  }
  return SHOWCASE_ORDER[index % SHOWCASE_ORDER.length];
}
