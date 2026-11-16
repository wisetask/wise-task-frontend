import type { Graph } from "./types";

export interface GraphStatistics {
  vertices: number;
  edges: number;
  loops: number;
  leaves: number;
  isolated: number;
  components: number;
}

export function countVertices(graph: Graph): number {
  return graph.vertices.length;
}

export function countEdges(graph: Graph): number {
  return graph.edges.length;
}

// Степень вершины. Петля (source === target) попадает в оба условия,
// поэтому добавляет к степени 2, как принято в теории графов.
// В ориентированном графе считаем и входящие, и исходящие рёбра.
export function vertexDegree(graph: Graph, vertexId: string): number {
  let degree = 0;
  for (const edge of graph.edges) {
    if (edge.source === vertexId) {
      degree += 1;
    }
    if (edge.target === vertexId) {
      degree += 1;
    }
  }
  return degree;
}

export function countLoops(graph: Graph): number {
  let count = 0;
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      count += 1;
    }
  }
  return count;
}

// Лист (он же висячая вершина) — вершина степени 1.
export function countLeaves(graph: Graph): number {
  let count = 0;
  for (const vertex of graph.vertices) {
    if (vertexDegree(graph, vertex.id) === 1) {
      count += 1;
    }
  }
  return count;
}

// Изолированная вершина — вершина степени 0.
export function countIsolated(graph: Graph): number {
  let count = 0;
  for (const vertex of graph.vertices) {
    if (vertexDegree(graph, vertex.id) === 0) {
      count += 1;
    }
  }
  return count;
}

// Число компонент связности. Направление рёбер не учитываем:
// для статистики важно, связаны ли вершины вообще.
export function countComponents(graph: Graph): number {
  // Соседи каждой вершины
  const neighbors = new Map<string, string[]>();
  for (const vertex of graph.vertices) {
    neighbors.set(vertex.id, []);
  }
  for (const edge of graph.edges) {
    const sourceList = neighbors.get(edge.source);
    const targetList = neighbors.get(edge.target);
    if (sourceList === undefined || targetList === undefined) {
      continue;
    }
    sourceList.push(edge.target);
    targetList.push(edge.source);
  }

  const visited = new Set<string>();
  let components = 0;

  for (const vertex of graph.vertices) {
    if (visited.has(vertex.id)) {
      continue;
    }

    // Нашли новую компоненту — обходим её целиком в ширину
    components += 1;
    visited.add(vertex.id);
    const queue: string[] = [vertex.id];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head];
      head += 1;
      for (const next of neighbors.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  }

  return components;
}

export function graphStatistics(graph: Graph): GraphStatistics {
  return {
    vertices: countVertices(graph),
    edges: countEdges(graph),
    loops: countLoops(graph),
    leaves: countLeaves(graph),
    isolated: countIsolated(graph),
    components: countComponents(graph),
  };
}
