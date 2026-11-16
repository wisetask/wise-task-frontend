import { createId } from "@/shared/lib/createId";
import type { Edge, EdgeChanges, Graph, Vertex, VertexChanges } from "./types";

export function createEmptyGraph(isDirected: boolean): Graph {
  return {
    name: "",
    isDirected: isDirected,
    vertices: [],
    edges: [],
  };
}

function withParts(graph: Graph, vertices: Vertex[], edges: Edge[]): Graph {
  return {
    name: graph.name,
    isDirected: graph.isDirected,
    vertices: vertices,
    edges: edges,
  };
}

export function findVertex(graph: Graph, vertexId: string): Vertex | undefined {
  for (const vertex of graph.vertices) {
    if (vertex.id === vertexId) {
      return vertex;
    }
  }
  return undefined;
}

export function nextVertexLabel(graph: Graph): string {
  let maxNumber = 0;
  for (const vertex of graph.vertices) {
    const number = Number(vertex.label);
    if (Number.isInteger(number) && number > maxNumber) {
      maxNumber = number;
    }
  }
  return String(maxNumber + 1);
}

export function addVertex(graph: Graph, x: number, y: number): Graph {
  const vertex: Vertex = {
    id: createId(),
    label: nextVertexLabel(graph),
    x: x,
    y: y,
    color: "GRAY",
    weight: 0,
  };
  return withParts(graph, graph.vertices.concat([vertex]), graph.edges);
}

export function moveVertex(graph: Graph, vertexId: string, x: number, y: number): Graph {
  const vertices: Vertex[] = [];
  for (const vertex of graph.vertices) {
    if (vertex.id === vertexId) {
      vertices.push({
        id: vertex.id,
        label: vertex.label,
        x: x,
        y: y,
        color: vertex.color,
        weight: vertex.weight,
      });
    } else {
      vertices.push(vertex);
    }
  }
  return withParts(graph, vertices, graph.edges);
}

export function removeVertex(graph: Graph, vertexId: string): Graph {
  const vertices = graph.vertices.filter((vertex) => vertex.id !== vertexId);
  const edges = graph.edges.filter((edge) => edge.source !== vertexId && edge.target !== vertexId);
  return withParts(graph, vertices, edges);
}

export function hasEdge(graph: Graph, sourceId: string, targetId: string): boolean {
  for (const edge of graph.edges) {
    if (edge.source === sourceId && edge.target === targetId) {
      return true;
    }
    if (!graph.isDirected && edge.source === targetId && edge.target === sourceId) {
      return true;
    }
  }
  return false;
}

export function addEdge(graph: Graph, sourceId: string, targetId: string): Graph {
  if (!findVertex(graph, sourceId) || !findVertex(graph, targetId)) {
    return graph;
  }
  if (hasEdge(graph, sourceId, targetId)) {
    return graph;
  }
  const edge: Edge = {
    id: createId(),
    source: sourceId,
    target: targetId,
    label: "",
    color: "GRAY",
    weight: 0,
  };
  return withParts(graph, graph.vertices, graph.edges.concat([edge]));
}

export function removeEdge(graph: Graph, edgeId: string): Graph {
  const edges = graph.edges.filter((edge) => edge.id !== edgeId);
  return withParts(graph, graph.vertices, edges);
}

export function setDirected(graph: Graph, isDirected: boolean): Graph {
  const edges: Edge[] = [];
  for (const edge of graph.edges) {
    let isReverseOfKept = false;
    if (!isDirected) {
      for (const kept of edges) {
        if (kept.source === edge.target && kept.target === edge.source) {
          isReverseOfKept = true;
        }
      }
    }
    if (!isReverseOfKept) {
      edges.push(edge);
    }
  }
  return {
    name: graph.name,
    isDirected: isDirected,
    vertices: graph.vertices,
    edges: edges,
  };
}

export function findEdge(graph: Graph, edgeId: string): Edge | undefined {
  for (const edge of graph.edges) {
    if (edge.id === edgeId) {
      return edge;
    }
  }
  return undefined;
}

export function updateVertex(graph: Graph, vertexId: string, changes: VertexChanges): Graph {
  const vertices: Vertex[] = [];
  for (const vertex of graph.vertices) {
    if (vertex.id === vertexId) {
      vertices.push({
        id: vertex.id,
        label: changes.label !== undefined ? changes.label : vertex.label,
        x: vertex.x,
        y: vertex.y,
        color: changes.color !== undefined ? changes.color : vertex.color,
        weight: changes.weight !== undefined ? changes.weight : vertex.weight,
      });
    } else {
      vertices.push(vertex);
    }
  }
  return withParts(graph, vertices, graph.edges);
}

export function updateEdge(graph: Graph, edgeId: string, changes: EdgeChanges): Graph {
  const edges: Edge[] = [];
  for (const edge of graph.edges) {
    if (edge.id === edgeId) {
      edges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: changes.label !== undefined ? changes.label : edge.label,
        color: changes.color !== undefined ? changes.color : edge.color,
        weight: changes.weight !== undefined ? changes.weight : edge.weight,
      });
    } else {
      edges.push(edge);
    }
  }
  return withParts(graph, graph.vertices, edges);
}
