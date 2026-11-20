import type { Graph } from "./types";

// Для определения типа и раскладки кратность рёбер не важна.
export function graphNeighbors(graph: Graph): Map<string, string[]> {
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
    if (!sourceList.includes(edge.target)) {
      sourceList.push(edge.target);
    }
    if (!targetList.includes(edge.source)) {
      targetList.push(edge.source);
    }
  }
  return neighbors;
}

// BFS из countComponents (T13), адаптированный для сбора компонент.
// Направление рёбер не учитываем.
export function splitIntoComponents(graph: Graph): Graph[] {
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
  const components: Graph[] = [];

  for (const vertex of graph.vertices) {
    if (visited.has(vertex.id)) {
      continue;
    }

    // Нашли новую компоненту — обходим её целиком в ширину
    const componentIds = new Set<string>([vertex.id]);
    visited.add(vertex.id);
    const queue: string[] = [vertex.id];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head];
      head += 1;
      for (const next of neighbors.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          componentIds.add(next);
          queue.push(next);
        }
      }
    }

    components.push({
      ...graph,
      vertices: graph.vertices.filter((item) => componentIds.has(item.id)),
      edges: graph.edges.filter(
        (edge) => componentIds.has(edge.source) && componentIds.has(edge.target),
      ),
    });
  }

  return components;
}
