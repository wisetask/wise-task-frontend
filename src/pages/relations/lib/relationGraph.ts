import type { Edge, Graph, Vertex } from "@/entities/graph";
import type { Matrix, RelationKind } from "@/entities/relation";

// Радиус круга, по которому расставляются вершины (как «Расположить по кругу»)
export const CIRCLE_RADIUS = 140;

export interface PathSelection {
  vertexIds: string[];
  edgeIds: string[];
}

export function vertexId(index: number): string {
  return "v" + index;
}

// Id ребра для пары (from, to). У симметричного отношения на пару одно ребро,
// и меньший номер идёт первым: путь 1 → 0 использует ребро "e0-1".
export function edgeId(from: number, to: number, kind: RelationKind): string {
  if (kind === "symmetric" && to < from) {
    return "e" + to + "-" + from;
  }
  return "e" + from + "-" + to;
}

function makeVertex(index: number, size: number): Vertex {
  // Первая вершина сверху, дальше по часовой стрелке
  const angle = (2 * Math.PI * index) / size - Math.PI / 2;
  return {
    id: vertexId(index),
    label: String(index + 1),
    x: CIRCLE_RADIUS * Math.cos(angle),
    y: CIRCLE_RADIUS * Math.sin(angle),
    color: "GRAY",
    weight: 0,
  };
}

function makeEdge(from: number, to: number, kind: RelationKind): Edge {
  return {
    id: edgeId(from, to, kind),
    source: vertexId(from),
    target: vertexId(to),
    label: "",
    color: "GRAY",
    weight: 0,
  };
}

// Граф отношения для показа: вершины 1..n по кругу, ребро на каждую пару матрицы.
// Симметричное отношение — неориентированный граф с одним ребром на пару.
export function relationToGraph(matrix: Matrix, kind: RelationKind): Graph {
  const size = matrix.length;
  const isSymmetric = kind === "symmetric";

  const vertices: Vertex[] = [];
  for (let i = 0; i < size; i++) {
    vertices.push(makeVertex(i, size));
  }

  const edges: Edge[] = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (isSymmetric) {
        if (j < i) {
          continue;
        }
        if (matrix[i][j] === 0 && matrix[j][i] === 0) {
          continue;
        }
      } else if (matrix[i][j] === 0) {
        continue;
      }
      edges.push(makeEdge(i, j, kind));
    }
  }

  return { name: "", isDirected: !isSymmetric, vertices: vertices, edges: edges };
}

function addUnique(list: string[], id: string) {
  if (!list.includes(id)) {
    list.push(id);
  }
}

// Какие вершины и рёбра подсветить для списка путей (из pathsOfLength).
export function pathSelection(paths: number[][], kind: RelationKind): PathSelection {
  const vertexIds: string[] = [];
  const edgeIds: string[] = [];
  for (const path of paths) {
    for (let i = 0; i < path.length; i++) {
      addUnique(vertexIds, vertexId(path[i]));
      if (i + 1 < path.length) {
        addUnique(edgeIds, edgeId(path[i], path[i + 1], kind));
      }
    }
  }
  return { vertexIds: vertexIds, edgeIds: edgeIds };
}
