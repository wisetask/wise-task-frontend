import type { Graph, Vertex } from "@/entities/graph";
import { splitIntoComponents } from "@/entities/graph";
import { layoutComponent } from "./layouts";

export function normalizeGraph(graph: Graph): Graph {
  const positioned = new Map<string, Vertex>();
  let offset = 0;
  for (const component of splitIntoComponents(graph)) {
    const layout = layoutComponent(component);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    for (const vertex of layout.vertices) {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
    }
    for (const vertex of layout.vertices) {
      positioned.set(vertex.id, { ...vertex, x: vertex.x - minX + offset, y: vertex.y - minY });
    }
    offset += maxX - minX + 100;
  }
  return { ...graph, vertices: graph.vertices.map((vertex) => positioned.get(vertex.id)!) };
}
