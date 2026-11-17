import { ref } from "vue";
import { moveVertex, type Graph, type Vertex } from "@/entities/graph";
import type { Point } from "./geometry";
import { usePointerDrag } from "./usePointerDrag";

interface DragCallbacks {
  toWorld: (event: MouseEvent) => Point;
  limit: (point: Point) => Point;
  getGraph: () => Graph;
  onStart: () => void;
  onMove: (graph: Graph) => void;
}

export function useVertexDrag(callbacks: DragCallbacks) {
  const draggedVertexId = ref<string | null>(null);
  let grabOffset: Point = { x: 0, y: 0 };

  const drag = usePointerDrag({
    onStart: callbacks.onStart,
    onMove: (event) => {
      if (draggedVertexId.value === null) {
        return;
      }
      const point = callbacks.toWorld(event);
      const wanted = { x: point.x - grabOffset.x, y: point.y - grabOffset.y };
      const position = callbacks.limit(wanted);
      const graph = callbacks.getGraph();
      callbacks.onMove(moveVertex(graph, draggedVertexId.value, position.x, position.y));
    },
    onEnd: () => {
      draggedVertexId.value = null;
    },
  });

  function startDrag(event: PointerEvent, vertex: Vertex) {
    const point = callbacks.toWorld(event);
    grabOffset = { x: point.x - vertex.x, y: point.y - vertex.y };
    draggedVertexId.value = vertex.id;
    drag.begin(event);
  }

  return {
    draggedVertexId: draggedVertexId,
    startDrag: startDrag,
    consumeClick: drag.consumeClick,
  };
}
