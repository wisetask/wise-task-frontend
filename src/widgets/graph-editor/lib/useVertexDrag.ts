import { onBeforeUnmount, ref } from "vue";
import { moveVertex, type Graph, type Vertex } from "@/entities/graph";
import type { Point } from "./geometry";

const DRAG_THRESHOLD = 3;

interface DragCallbacks {
  toWorld: (event: MouseEvent) => Point;
  limit: (point: Point) => Point;
  getGraph: () => Graph;
  onStart: () => void;
  onMove: (graph: Graph) => void;
}

export function useVertexDrag(callbacks: DragCallbacks) {
  const draggedVertexId = ref<string | null>(null);

  let pressX = 0;
  let pressY = 0;
  let grabOffset: Point = { x: 0, y: 0 };
  let hasMoved = false;
  let skipNextClick = false;

  function startDrag(event: PointerEvent, vertex: Vertex) {
    const point = callbacks.toWorld(event);
    skipNextClick = false;
    hasMoved = false;
    draggedVertexId.value = vertex.id;
    pressX = event.clientX;
    pressY = event.clientY;
    grabOffset = { x: point.x - vertex.x, y: point.y - vertex.y };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
  }

  function onPointerMove(event: PointerEvent) {
    if (draggedVertexId.value === null) {
      return;
    }
    if (!hasMoved) {
      const dx = Math.abs(event.clientX - pressX);
      const dy = Math.abs(event.clientY - pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }
      hasMoved = true;
      callbacks.onStart();
    }
    const point = callbacks.toWorld(event);
    const wanted = { x: point.x - grabOffset.x, y: point.y - grabOffset.y };
    const position = callbacks.limit(wanted);
    const graph = callbacks.getGraph();
    callbacks.onMove(moveVertex(graph, draggedVertexId.value, position.x, position.y));
  }

  function stopDrag() {
    if (hasMoved) {
      skipNextClick = true;
    }
    hasMoved = false;
    draggedVertexId.value = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDrag);
  }

  function consumeClick(): boolean {
    if (skipNextClick) {
      skipNextClick = false;
      return true;
    }
    return false;
  }

  onBeforeUnmount(() => {
    stopDrag();
  });

  return {
    draggedVertexId: draggedVertexId,
    startDrag: startDrag,
    consumeClick: consumeClick,
  };
}
