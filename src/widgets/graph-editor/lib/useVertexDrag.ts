import { ref } from "vue";
import { findVertex, moveVertices, type Graph, type Vertex } from "@/entities/graph";
import type { Point } from "./geometry";
import { usePointerDrag } from "./usePointerDrag";

interface DragCallbacks {
  toWorld: (event: MouseEvent) => Point;
  limit: (point: Point) => Point;
  getGraph: () => Graph;
  getGroup: (vertexId: string) => string[];
  onStart: () => void;
  onMove: (graph: Graph) => void;
  adjust?: (position: Point, group: string[], free: boolean) => Point;
  onEnd?: () => void;
}

export function useVertexDrag(callbacks: DragCallbacks) {
  const draggedVertexId = ref<string | null>(null);
  let grabOffset: Point = { x: 0, y: 0 };
  let group: string[] = [];

  const drag = usePointerDrag({
    onStart: callbacks.onStart,
    onMove: (event) => {
      if (draggedVertexId.value === null) {
        return;
      }
      const point = callbacks.toWorld(event);
      const wanted = { x: point.x - grabOffset.x, y: point.y - grabOffset.y };
      let position = callbacks.limit(wanted);
      if (callbacks.adjust !== undefined) {
        position = callbacks.adjust(position, group, event.altKey);
      }
      const graph = callbacks.getGraph();
      const vertex = findVertex(graph, draggedVertexId.value);
      if (vertex === undefined) {
        return;
      }
      const dx = position.x - vertex.x;
      const dy = position.y - vertex.y;
      callbacks.onMove(moveVertices(graph, group, dx, dy));
    },
    onEnd: () => {
      draggedVertexId.value = null;
      group = [];
      if (callbacks.onEnd !== undefined) {
        callbacks.onEnd();
      }
    },
  });

  function startDrag(event: PointerEvent, vertex: Vertex) {
    const point = callbacks.toWorld(event);
    grabOffset = { x: point.x - vertex.x, y: point.y - vertex.y };
    draggedVertexId.value = vertex.id;
    group = callbacks.getGroup(vertex.id);
    drag.begin(event);
  }

  return {
    draggedVertexId: draggedVertexId,
    startDrag: startDrag,
    consumeClick: drag.consumeClick,
  };
}
