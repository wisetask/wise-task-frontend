import type { Graph, Vertex } from "@/entities/graph";
import type { Point } from "./geometry";
import { pointsArea } from "./viewport";
import {
  arrangeComponents,
  isBipartite,
  isCycle,
  layoutBipartite,
  layoutCircle,
  layoutCycle,
  layoutTree,
  normalizeGraph,
} from "@/features/graph-normalize";

export type LayoutKind = "auto" | "circle" | "grid" | "levels" | "bipartite";

export const LAYOUT_STEP = 100;

function centerOf(graph: Graph): Point {
  const area = pointsArea(graph.vertices);
  if (area === null) {
    return { x: 0, y: 0 };
  }
  return { x: (area.left + area.right) / 2, y: (area.top + area.bottom) / 2 };
}

function placeVertices(graph: Graph, positions: Map<string, Point>): Graph {
  const vertices: Vertex[] = [];
  for (const vertex of graph.vertices) {
    const position = positions.get(vertex.id);
    if (position === undefined) {
      vertices.push(vertex);
    } else {
      vertices.push({
        id: vertex.id,
        label: vertex.label,
        x: position.x,
        y: position.y,
        color: vertex.color,
        weight: vertex.weight,
      });
    }
  }
  return {
    name: graph.name,
    isDirected: graph.isDirected,
    vertices: vertices,
    edges: graph.edges,
  };
}

export function gridPositions(graph: Graph): Map<string, Point> {
  const positions = new Map<string, Point>();
  const center = centerOf(graph);
  const count = graph.vertices.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const left = center.x - ((columns - 1) * LAYOUT_STEP) / 2;
  const top = center.y - ((rows - 1) * LAYOUT_STEP) / 2;
  for (let i = 0; i < count; i++) {
    positions.set(graph.vertices[i].id, {
      x: left + (i % columns) * LAYOUT_STEP,
      y: top + Math.floor(i / columns) * LAYOUT_STEP,
    });
  }
  return positions;
}

export function canLayout(graph: Graph, kind: LayoutKind): boolean {
  if (graph.vertices.length < 2) {
    return false;
  }
  if (kind === "bipartite") {
    return isBipartite(graph);
  }
  return true;
}

export function layoutGraph(graph: Graph, kind: LayoutKind, rootId: string | null): Graph {
  if (!canLayout(graph, kind)) {
    return graph;
  }
  let arranged: Graph;
  switch (kind) {
    case "auto":
      arranged = normalizeGraph(graph);
      break;
    case "circle":
      arranged = isCycle(graph) ? layoutCycle(graph) : layoutCircle(graph);
      break;
    case "grid":
      arranged = placeVertices(graph, gridPositions(graph));
      break;
    case "bipartite":
      arranged = layoutBipartite(graph);
      break;
    case "levels":
      arranged = arrangeComponents(graph, (component) => layoutTree(component, rootId));
      break;
  }
  return keepCenter(graph, arranged);
}

function keepCenter(before: Graph, after: Graph): Graph {
  const beforeCenter = centerOf(before);
  const afterCenter = centerOf(after);
  const dx = beforeCenter.x - afterCenter.x;
  const dy = beforeCenter.y - afterCenter.y;
  return {
    ...after,
    vertices: after.vertices.map((vertex) => ({
      ...vertex,
      x: Math.round(vertex.x + dx),
      y: Math.round(vertex.y + dy),
    })),
  };
}
