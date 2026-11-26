import type { Edge, Graph } from "@/entities/graph";

export type AlgorithmKind = "bfs" | "dfs" | "dijkstra" | "prim";

export interface AlgorithmStep {
  current: string | null;
  visited: string[];
  frontier: string[];
  treeEdges: string[];
  activeEdge: string | null;
  labels: Record<string, string>;
  structureTitle: string;
  structure: string[];
  note: string;
}

export interface AlgorithmRun {
  kind: AlgorithmKind;
  title: string;
  steps: AlgorithmStep[];
  error: string;
}

export const ALGORITHM_KINDS: AlgorithmKind[] = ["bfs", "dfs", "dijkstra", "prim"];

export const ALGORITHM_TITLES: Record<AlgorithmKind, string> = {
  bfs: "Обход в ширину",
  dfs: "Обход в глубину",
  dijkstra: "Дейкстра",
  prim: "Остов (Прим)",
};

interface Arc {
  edge: Edge;
  to: string;
  weight: number;
}

interface Tracker {
  visited: string[];
  frontier: string[];
  treeEdges: string[];
  labels: Record<string, string>;
  structureTitle: string;
  structure: string[];
}

function createTracker(structureTitle: string): Tracker {
  return {
    visited: [],
    frontier: [],
    treeEdges: [],
    labels: {},
    structureTitle: structureTitle,
    structure: [],
  };
}

function snapshot(
  tracker: Tracker,
  note: string,
  current: string | null,
  activeEdge: string | null,
): AlgorithmStep {
  const labels: Record<string, string> = {};
  for (const id in tracker.labels) {
    labels[id] = tracker.labels[id];
  }
  return {
    current: current,
    visited: tracker.visited.slice(),
    frontier: tracker.frontier.slice(),
    treeEdges: tracker.treeEdges.slice(),
    activeEdge: activeEdge,
    labels: labels,
    structureTitle: tracker.structureTitle,
    structure: tracker.structure.slice(),
    note: note,
  };
}

function nameOf(graph: Graph, id: string): string {
  for (const vertex of graph.vertices) {
    if (vertex.id === id) {
      return vertex.label;
    }
  }
  return "?";
}

function namesOf(graph: Graph, ids: string[]): string[] {
  return ids.map((id) => nameOf(graph, id));
}

function compareLabels(first: string, second: string): number {
  return first.localeCompare(second, "ru", { numeric: true });
}

function edgeName(graph: Graph, from: string, to: string): string {
  const sign = graph.isDirected ? " → " : " — ";
  return nameOf(graph, from) + sign + nameOf(graph, to);
}

function usesWeights(graph: Graph): boolean {
  for (const edge of graph.edges) {
    if (edge.source !== edge.target && edge.weight !== 0) {
      return true;
    }
  }
  return false;
}

function hasNegativeWeight(graph: Graph): boolean {
  for (const edge of graph.edges) {
    if (edge.source !== edge.target && edge.weight < 0) {
      return true;
    }
  }
  return false;
}

function arcsFrom(graph: Graph, id: string, plainWeights: boolean): Arc[] {
  const arcs: Arc[] = [];
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }
    let to = "";
    if (edge.source === id) {
      to = edge.target;
    } else if (!graph.isDirected && edge.target === id) {
      to = edge.source;
    }
    if (to !== "") {
      arcs.push({ edge: edge, to: to, weight: plainWeights ? 1 : edge.weight });
    }
  }
  arcs.sort((first, second) => compareLabels(nameOf(graph, first.to), nameOf(graph, second.to)));
  return arcs;
}

function without(ids: string[], id: string): string[] {
  return ids.filter((item) => item !== id);
}

function unreachedText(graph: Graph, reached: Record<string, boolean>): string {
  const missing: string[] = [];
  for (const vertex of graph.vertices) {
    if (!reached[vertex.id]) {
      missing.push(vertex.label);
    }
  }
  if (missing.length === 0) {
    return "";
  }
  return " Не достали: " + missing.join(", ") + ".";
}

function bfsSteps(graph: Graph, start: string): AlgorithmStep[] {
  const tracker = createTracker("Очередь");
  const steps: AlgorithmStep[] = [];
  const distance: Record<string, number> = {};
  const reached: Record<string, boolean> = {};
  const queue = [start];
  distance[start] = 0;
  reached[start] = true;
  tracker.frontier = [start];
  tracker.labels[start] = "0";
  tracker.structure = namesOf(graph, queue);
  steps.push(
    snapshot(
      tracker,
      "Начинаем с вершины " + nameOf(graph, start) + ": расстояние 0, кладём её в очередь.",
      null,
      null,
    ),
  );
  while (queue.length > 0) {
    const current = queue.shift() as string;
    tracker.frontier = without(tracker.frontier, current);
    tracker.structure = namesOf(graph, queue);
    steps.push(
      snapshot(
        tracker,
        "Достаём из очереди " + nameOf(graph, current) + " и смотрим её соседей.",
        current,
        null,
      ),
    );
    for (const arc of arcsFrom(graph, current, true)) {
      if (reached[arc.to]) {
        continue;
      }
      reached[arc.to] = true;
      distance[arc.to] = distance[current] + 1;
      queue.push(arc.to);
      tracker.frontier.push(arc.to);
      tracker.treeEdges.push(arc.edge.id);
      tracker.labels[arc.to] = String(distance[arc.to]);
      tracker.structure = namesOf(graph, queue);
      const note =
        "Сосед " +
        nameOf(graph, arc.to) +
        " ещё не встречался: расстояние " +
        distance[arc.to] +
        ", кладём в конец очереди.";
      steps.push(snapshot(tracker, note, current, arc.edge.id));
    }
    tracker.visited.push(current);
  }
  const done = "Готово: дошли до " + tracker.visited.length + " вершин.";
  steps.push(snapshot(tracker, done + unreachedText(graph, reached), null, null));
  return steps;
}

interface DfsFrame {
  id: string;
  arcs: Arc[];
  next: number;
}

function stackNames(graph: Graph, stack: DfsFrame[]): string[] {
  return stack.map((frame) => nameOf(graph, frame.id));
}

function dfsSteps(graph: Graph, start: string): AlgorithmStep[] {
  const tracker = createTracker("Стек");
  const steps: AlgorithmStep[] = [];
  const reached: Record<string, boolean> = {};
  const order: string[] = [];
  const stack: DfsFrame[] = [];

  function enter(id: string) {
    reached[id] = true;
    order.push(id);
    tracker.labels[id] = String(order.length);
    tracker.frontier.push(id);
    stack.push({ id: id, arcs: arcsFrom(graph, id, true), next: 0 });
    tracker.structure = stackNames(graph, stack);
  }

  enter(start);
  steps.push(
    snapshot(tracker, "Начинаем с вершины " + nameOf(graph, start) + ": она первая.", start, null),
  );
  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    let found: Arc | null = null;
    while (top.next < top.arcs.length && found === null) {
      const arc = top.arcs[top.next];
      top.next = top.next + 1;
      if (!reached[arc.to]) {
        found = arc;
      }
    }
    if (found !== null) {
      enter(found.to);
      tracker.treeEdges.push(found.edge.id);
      const note =
        "Из " +
        nameOf(graph, top.id) +
        " идём в новую вершину " +
        nameOf(graph, found.to) +
        " — она " +
        order.length +
        "-я по счёту.";
      steps.push(snapshot(tracker, note, found.to, found.edge.id));
      continue;
    }
    stack.pop();
    tracker.frontier = without(tracker.frontier, top.id);
    tracker.visited.push(top.id);
    tracker.structure = stackNames(graph, stack);
    if (stack.length > 0) {
      const back = stack[stack.length - 1].id;
      const note =
        "Из " +
        nameOf(graph, top.id) +
        " идти некуда — возвращаемся в " +
        nameOf(graph, back) +
        ".";
      steps.push(snapshot(tracker, note, back, null));
    }
  }
  const done = "Готово: порядок обхода — " + namesOf(graph, order).join(", ") + ".";
  steps.push(snapshot(tracker, done + unreachedText(graph, reached), null, null));
  return steps;
}

function candidatesText(graph: Graph, ids: string[], distance: Record<string, number>): string[] {
  const sorted = ids.slice();
  sorted.sort((first, second) => distance[first] - distance[second]);
  return sorted.map((id) => nameOf(graph, id) + ": " + distance[id]);
}

function dijkstraSteps(graph: Graph, start: string): AlgorithmStep[] {
  const tracker = createTracker("Кандидаты");
  const steps: AlgorithmStep[] = [];
  const plain = !usesWeights(graph);
  const distance: Record<string, number> = {};
  const done: Record<string, boolean> = {};
  const parentEdge: Record<string, string> = {};
  for (const vertex of graph.vertices) {
    tracker.labels[vertex.id] = "∞";
  }
  distance[start] = 0;
  tracker.labels[start] = "0";
  tracker.frontier = [start];
  tracker.structure = candidatesText(graph, tracker.frontier, distance);
  let intro = "Расстояние до " + nameOf(graph, start) + " — 0, до остальных пока ∞.";
  if (plain) {
    intro = intro + " Веса не заданы, поэтому каждое ребро считаем за 1.";
  }
  steps.push(snapshot(tracker, intro, null, null));
  while (tracker.frontier.length > 0) {
    let current = tracker.frontier[0];
    for (const id of tracker.frontier) {
      if (distance[id] < distance[current]) {
        current = id;
      }
    }
    done[current] = true;
    tracker.frontier = without(tracker.frontier, current);
    tracker.structure = candidatesText(graph, tracker.frontier, distance);
    const pick =
      "Ближайшая из необработанных — " +
      nameOf(graph, current) +
      " (расстояние " +
      distance[current] +
      "). Её расстояние больше не изменится.";
    steps.push(snapshot(tracker, pick, current, null));
    for (const arc of arcsFrom(graph, current, plain)) {
      if (done[arc.to]) {
        continue;
      }
      const through = distance[current] + arc.weight;
      const old = distance[arc.to];
      const sum = distance[current] + " + " + arc.weight + " = " + through;
      const route = "Через " + nameOf(graph, current) + " до " + nameOf(graph, arc.to);
      const prefix = route + ": " + sum;
      if (old === undefined || through < old) {
        distance[arc.to] = through;
        parentEdge[arc.to] = arc.edge.id;
        tracker.labels[arc.to] = String(through);
        if (!tracker.frontier.includes(arc.to)) {
          tracker.frontier.push(arc.to);
        }
        tracker.treeEdges = [];
        for (const id in parentEdge) {
          tracker.treeEdges.push(parentEdge[id]);
        }
        tracker.structure = candidatesText(graph, tracker.frontier, distance);
        let note = prefix + ", раньше пути не было — записываем.";
        if (old !== undefined) {
          note = prefix + " < " + old + " — нашли короче, обновляем.";
        }
        steps.push(snapshot(tracker, note, current, arc.edge.id));
      } else {
        const note = prefix + ", но уже есть " + old + " — оставляем.";
        steps.push(snapshot(tracker, note, current, arc.edge.id));
      }
    }
    tracker.visited.push(current);
  }
  const finish = "Готово: над вершинами кратчайшие расстояния от " + nameOf(graph, start) + ".";
  steps.push(snapshot(tracker, finish + unreachedText(graph, done), null, null));
  return steps;
}

function primSteps(graph: Graph, start: string): AlgorithmStep[] {
  const tracker = createTracker("Рёбра остова");
  const steps: AlgorithmStep[] = [];
  const plain = !usesWeights(graph);
  const inTree: Record<string, boolean> = {};
  let total = 0;
  inTree[start] = true;
  tracker.visited = [start];
  let intro = "Начинаем дерево с вершины " + nameOf(graph, start) + ".";
  if (plain) {
    intro = intro + " Веса не заданы, поэтому каждое ребро считаем за 1.";
  }
  steps.push(snapshot(tracker, intro, start, null));
  let growing = true;
  while (growing) {
    let best: Arc | null = null;
    let bestFrom = "";
    const frontier: string[] = [];
    for (const id of tracker.visited) {
      for (const arc of arcsFrom(graph, id, plain)) {
        if (inTree[arc.to]) {
          continue;
        }
        if (!frontier.includes(arc.to)) {
          frontier.push(arc.to);
        }
        if (best === null || arc.weight < best.weight) {
          best = arc;
          bestFrom = id;
        }
      }
    }
    tracker.frontier = frontier;
    if (best === null) {
      growing = false;
      continue;
    }
    inTree[best.to] = true;
    total = total + best.weight;
    tracker.visited.push(best.to);
    tracker.frontier = without(tracker.frontier, best.to);
    tracker.treeEdges.push(best.edge.id);
    tracker.structure.push(edgeName(graph, bestFrom, best.to));
    const note =
      "Самое лёгкое ребро от дерева к остальным — " +
      edgeName(graph, bestFrom, best.to) +
      " (вес " +
      best.weight +
      "). Добавляем " +
      nameOf(graph, best.to) +
      ".";
    steps.push(snapshot(tracker, note, best.to, best.edge.id));
  }
  tracker.frontier = [];
  const finish = "Готово: вес остова — " + total + ".";
  steps.push(snapshot(tracker, finish + unreachedText(graph, inTree), null, null));
  return steps;
}

export function runAlgorithm(kind: AlgorithmKind, graph: Graph, startId: string): AlgorithmRun {
  const title = ALGORITHM_TITLES[kind] + " из " + nameOf(graph, startId);
  const run: AlgorithmRun = { kind: kind, title: title, steps: [], error: "" };
  if (nameOf(graph, startId) === "?") {
    run.error = "Такой вершины уже нет.";
    return run;
  }
  if (kind === "bfs") {
    run.steps = bfsSteps(graph, startId);
  } else if (kind === "dfs") {
    run.steps = dfsSteps(graph, startId);
  } else if (kind === "dijkstra") {
    if (hasNegativeWeight(graph)) {
      run.error = "Дейкстра не работает с отрицательными весами: уберите минусы у рёбер.";
    } else {
      run.steps = dijkstraSteps(graph, startId);
    }
  } else if (graph.isDirected) {
    run.error = "Остов Прима строится только для неориентированного графа.";
  } else {
    run.steps = primSteps(graph, startId);
  }
  return run;
}
