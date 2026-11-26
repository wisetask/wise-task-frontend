import type { Graph } from "@/entities/graph";
import { simpleNeighbors } from "./graphFacts";

export interface StarShape {
  centerId: string;
  leafIds: string[];
}

const EULER_MIN_EDGES = 6;
const STAR_MIN_LEAVES = 8;
const GRAF_LETTERS = ["Г", "Р", "А", "Ф"];

function hasLoop(graph: Graph): boolean {
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      return true;
    }
  }
  return false;
}

export function eulerCircuit(graph: Graph): string[] | null {
  if (graph.isDirected || hasLoop(graph) || graph.edges.length < EULER_MIN_EDGES) {
    return null;
  }
  const incident: Record<string, number[]> = {};
  for (const vertex of graph.vertices) {
    incident[vertex.id] = [];
  }
  for (let i = 0; i < graph.edges.length; i++) {
    incident[graph.edges[i].source].push(i);
    incident[graph.edges[i].target].push(i);
  }
  let start = "";
  for (const vertex of graph.vertices) {
    const degree = incident[vertex.id].length;
    if (degree % 2 !== 0) {
      return null;
    }
    if (degree > 0 && start === "") {
      start = vertex.id;
    }
  }
  const used: boolean[] = [];
  for (let i = 0; i < graph.edges.length; i++) {
    used.push(false);
  }
  const next: Record<string, number> = {};
  for (const vertex of graph.vertices) {
    next[vertex.id] = 0;
  }
  const stack = [start];
  const circuit: string[] = [];
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const list = incident[current];
    while (next[current] < list.length && used[list[next[current]]]) {
      next[current] = next[current] + 1;
    }
    if (next[current] === list.length) {
      circuit.push(current);
      stack.pop();
      continue;
    }
    const index = list[next[current]];
    used[index] = true;
    const edge = graph.edges[index];
    if (edge.source === current) {
      stack.push(edge.target);
    } else {
      stack.push(edge.source);
    }
  }
  if (circuit.length !== graph.edges.length + 1) {
    return null;
  }
  return circuit;
}

function degreesOf(graph: Graph): Record<string, number> {
  const degrees: Record<string, number> = {};
  for (const vertex of graph.vertices) {
    degrees[vertex.id] = 0;
  }
  for (const edge of graph.edges) {
    degrees[edge.source] = degrees[edge.source] + 1;
    degrees[edge.target] = degrees[edge.target] + 1;
  }
  return degrees;
}

function bridgeCount(bridges: string[][], first: string, second: string): number {
  let count = 0;
  for (const pair of bridges) {
    if ((pair[0] === first && pair[1] === second) || (pair[0] === second && pair[1] === first)) {
      count = count + 1;
    }
  }
  return count;
}

export function konigsbergLands(graph: Graph): string[] | null {
  if (graph.isDirected || graph.vertices.length !== 11 || graph.edges.length !== 14) {
    return null;
  }
  const neighbors = simpleNeighbors(graph);
  const degrees = degreesOf(graph);
  const lands: string[] = [];
  const bridges: string[][] = [];
  for (const vertex of graph.vertices) {
    const degree = degrees[vertex.id];
    if (degree === 2) {
      const ends = neighbors[vertex.id];
      if (ends.length !== 2) {
        return null;
      }
      bridges.push([ends[0], ends[1]]);
    } else if (degree === 3 || degree === 5) {
      lands.push(vertex.id);
    } else {
      return null;
    }
  }
  if (lands.length !== 4 || bridges.length !== 7) {
    return null;
  }
  for (const pair of bridges) {
    if (!lands.includes(pair[0]) || !lands.includes(pair[1])) {
      return null;
    }
  }
  let big = "";
  const small: string[] = [];
  for (const land of lands) {
    if (degrees[land] === 5) {
      big = land;
    } else {
      small.push(land);
    }
  }
  if (big === "" || small.length !== 3) {
    return null;
  }
  let middle = "";
  const sides: string[] = [];
  for (const land of small) {
    const toBig = bridgeCount(bridges, big, land);
    if (toBig === 1) {
      middle = land;
    } else if (toBig === 2) {
      sides.push(land);
    } else {
      return null;
    }
  }
  if (middle === "" || sides.length !== 2) {
    return null;
  }
  const toFirst = bridgeCount(bridges, middle, sides[0]);
  const toSecond = bridgeCount(bridges, middle, sides[1]);
  if (toFirst !== 1 || toSecond !== 1) {
    return null;
  }
  return [big, sides[0], sides[1], middle];
}

function findByLabel(graph: Graph, letter: string): string[] {
  const ids: string[] = [];
  for (const vertex of graph.vertices) {
    if (vertex.label.trim().toUpperCase() === letter) {
      ids.push(vertex.id);
    }
  }
  return ids;
}

export function grafWord(graph: Graph): string[] | null {
  const neighbors = simpleNeighbors(graph);
  const found: string[] = [];
  for (const letter of GRAF_LETTERS) {
    const ids = findByLabel(graph, letter);
    if (ids.length !== 1) {
      return null;
    }
    found.push(ids[0]);
  }
  for (let i = 0; i + 1 < found.length; i++) {
    if (!neighbors[found[i]].includes(found[i + 1])) {
      return null;
    }
  }
  return found;
}

export function starShape(graph: Graph): StarShape | null {
  const neighbors = simpleNeighbors(graph);
  const degrees = degreesOf(graph);
  for (const vertex of graph.vertices) {
    const around = neighbors[vertex.id];
    if (around.length < STAR_MIN_LEAVES || degrees[vertex.id] !== around.length) {
      continue;
    }
    let allLeaves = true;
    for (const id of around) {
      if (degrees[id] !== 1) {
        allLeaves = false;
      }
    }
    if (allLeaves) {
      return { centerId: vertex.id, leafIds: around.slice() };
    }
  }
  return null;
}
