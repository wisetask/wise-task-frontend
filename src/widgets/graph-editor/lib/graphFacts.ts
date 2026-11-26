import type { Graph } from "@/entities/graph";

export interface GraphFact {
  title: string;
  value: boolean;
  note: string;
}

export type SpecialGraph = "petersen" | "k5" | "k33";

export function simpleNeighbors(graph: Graph): Record<string, string[]> {
  const neighbors: Record<string, string[]> = {};
  for (const vertex of graph.vertices) {
    neighbors[vertex.id] = [];
  }
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }
    const fromList = neighbors[edge.source];
    const toList = neighbors[edge.target];
    if (fromList === undefined || toList === undefined) {
      continue;
    }
    if (!fromList.includes(edge.target)) {
      fromList.push(edge.target);
      toList.push(edge.source);
    }
  }
  return neighbors;
}

function hasLoop(graph: Graph): boolean {
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      return true;
    }
  }
  return false;
}

function countSimpleEdges(neighbors: Record<string, string[]>): number {
  let total = 0;
  for (const id in neighbors) {
    total = total + neighbors[id].length;
  }
  return total / 2;
}

function countComponents(graph: Graph, neighbors: Record<string, string[]>): number {
  const visited: Record<string, boolean> = {};
  let count = 0;
  for (const vertex of graph.vertices) {
    if (visited[vertex.id]) {
      continue;
    }
    count = count + 1;
    const queue = [vertex.id];
    visited[vertex.id] = true;
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of neighbors[current]) {
        if (!visited[next]) {
          visited[next] = true;
          queue.push(next);
        }
      }
    }
  }
  return count;
}

function isBipartite(graph: Graph, neighbors: Record<string, string[]>): boolean {
  if (hasLoop(graph)) {
    return false;
  }
  const side: Record<string, number> = {};
  for (const vertex of graph.vertices) {
    if (side[vertex.id] !== undefined) {
      continue;
    }
    side[vertex.id] = 0;
    const queue = [vertex.id];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of neighbors[current]) {
        if (side[next] === undefined) {
          side[next] = 1 - side[current];
          queue.push(next);
        } else if (side[next] === side[current]) {
          return false;
        }
      }
    }
  }
  return true;
}

function isComplete(graph: Graph, neighbors: Record<string, string[]>): boolean {
  if (hasLoop(graph)) {
    return false;
  }
  for (const vertex of graph.vertices) {
    if (neighbors[vertex.id].length !== graph.vertices.length - 1) {
      return false;
    }
  }
  return true;
}

function regularDegree(graph: Graph, neighbors: Record<string, string[]>): number | null {
  if (hasLoop(graph) || countSimpleEdges(neighbors) !== graph.edges.length) {
    return null;
  }
  const first = neighbors[graph.vertices[0].id].length;
  for (const vertex of graph.vertices) {
    if (neighbors[vertex.id].length !== first) {
      return null;
    }
  }
  return first;
}

function outNeighbors(graph: Graph): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const vertex of graph.vertices) {
    result[vertex.id] = [];
  }
  for (const edge of graph.edges) {
    if (result[edge.source] !== undefined && result[edge.target] !== undefined) {
      result[edge.source].push(edge.target);
    }
  }
  return result;
}

function reachableCount(start: string, lists: Record<string, string[]>): number {
  const visited: Record<string, boolean> = {};
  visited[start] = true;
  const stack = [start];
  let count = 1;
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const next of lists[current]) {
      if (!visited[next]) {
        visited[next] = true;
        count = count + 1;
        stack.push(next);
      }
    }
  }
  return count;
}

function isStronglyConnected(graph: Graph): boolean {
  const forward = outNeighbors(graph);
  const backward: Record<string, string[]> = {};
  for (const vertex of graph.vertices) {
    backward[vertex.id] = [];
  }
  for (const id in forward) {
    for (const next of forward[id]) {
      backward[next].push(id);
    }
  }
  const start = graph.vertices[0].id;
  const total = graph.vertices.length;
  return reachableCount(start, forward) === total && reachableCount(start, backward) === total;
}

function hasDirectedCycle(graph: Graph): boolean {
  const lists = outNeighbors(graph);
  const state: Record<string, number> = {};
  for (const vertex of graph.vertices) {
    if (state[vertex.id] !== undefined) {
      continue;
    }
    const stack: string[] = [vertex.id];
    const nextIndex: Record<string, number> = {};
    state[vertex.id] = 1;
    nextIndex[vertex.id] = 0;
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const list = lists[current];
      if (nextIndex[current] >= list.length) {
        state[current] = 2;
        stack.pop();
        continue;
      }
      const next = list[nextIndex[current]];
      nextIndex[current] = nextIndex[current] + 1;
      if (state[next] === 1) {
        return true;
      }
      if (state[next] === undefined) {
        state[next] = 1;
        nextIndex[next] = 0;
        stack.push(next);
      }
    }
  }
  return false;
}

function fact(title: string, value: boolean, note: string): GraphFact {
  return { title: title, value: value, note: note };
}

export function graphFacts(graph: Graph): GraphFact[] {
  if (graph.vertices.length === 0) {
    return [];
  }
  const neighbors = simpleNeighbors(graph);
  const connected = countComponents(graph, neighbors) === 1;
  const bipartite = isBipartite(graph, neighbors);
  if (graph.isDirected) {
    return [
      fact("Слабо связный", connected, ""),
      fact("Сильно связный", isStronglyConnected(graph), ""),
      fact("Есть цикл", hasDirectedCycle(graph), ""),
      fact("Двудольный", bipartite, "без учёта стрелок"),
    ];
  }
  const simple = !hasLoop(graph) && countSimpleEdges(neighbors) === graph.edges.length;
  const treeEdges = graph.vertices.length - countComponents(graph, neighbors);
  const forest = simple && countSimpleEdges(neighbors) === treeEdges;
  const degree = regularDegree(graph, neighbors);
  return [
    fact("Связный", connected, ""),
    fact("Дерево", connected && forest, ""),
    fact("Есть цикл", !forest, ""),
    fact("Двудольный", bipartite, ""),
    fact("Полный", isComplete(graph, neighbors), ""),
    fact("Регулярный", degree !== null, degree === null ? "" : "степень " + degree),
  ];
}

function commonCount(first: string[], second: string[]): number {
  let count = 0;
  for (const id of first) {
    if (second.includes(id)) {
      count = count + 1;
    }
  }
  return count;
}

function isPetersen(graph: Graph, neighbors: Record<string, string[]>): boolean {
  if (graph.vertices.length !== 10 || countSimpleEdges(neighbors) !== 15) {
    return false;
  }
  if (regularDegree(graph, neighbors) !== 3 || countComponents(graph, neighbors) !== 1) {
    return false;
  }
  for (let i = 0; i < graph.vertices.length; i++) {
    for (let j = i + 1; j < graph.vertices.length; j++) {
      const first = graph.vertices[i].id;
      const second = graph.vertices[j].id;
      const common = commonCount(neighbors[first], neighbors[second]);
      const adjacent = neighbors[first].includes(second);
      if (adjacent && common > 0) {
        return false;
      }
      if (common > 1) {
        return false;
      }
    }
  }
  return true;
}

export function specialGraph(graph: Graph): SpecialGraph | null {
  if (hasLoop(graph)) {
    return null;
  }
  const neighbors = simpleNeighbors(graph);
  if (countSimpleEdges(neighbors) !== graph.edges.length) {
    return null;
  }
  const count = graph.vertices.length;
  if (count === 5 && isComplete(graph, neighbors)) {
    return "k5";
  }
  if (count === 6 && regularDegree(graph, neighbors) === 3 && isBipartite(graph, neighbors)) {
    return "k33";
  }
  if (isPetersen(graph, neighbors)) {
    return "petersen";
  }
  return null;
}
