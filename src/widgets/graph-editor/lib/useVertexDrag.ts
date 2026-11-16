import { onBeforeUnmount, ref, type Ref } from "vue";
import { moveVertex, type Graph, type Vertex } from "@/entities/graph";
import { VERTEX_RADIUS, type Point } from "./geometry";
import { keepInside, toCanvasPoint } from "./pointer";

const DRAG_THRESHOLD = 3;

interface DragCallbacks {
  getGraph: () => Graph;
  onStart: () => void;
  onMove: (graph: Graph) => void;
}

export function useVertexDrag(svgElement: Ref<SVGSVGElement | null>, callbacks: DragCallbacks) {
  const draggedVertexId = ref<string | null>(null);

  let pressPoint: Point = { x: 0, y: 0 };
  let grabOffset: Point = { x: 0, y: 0 };
  let hasMoved = false;
  let skipNextClick = false;

  function startDrag(event: PointerEvent, vertex: Vertex) {
    const point = toCanvasPoint(svgElement.value, event);
    skipNextClick = false;
    hasMoved = false;
    draggedVertexId.value = vertex.id;
    pressPoint = point;
    grabOffset = { x: point.x - vertex.x, y: point.y - vertex.y };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
  }

  function onPointerMove(event: PointerEvent) {
    if (draggedVertexId.value === null) {
      return;
    }
    const point = toCanvasPoint(svgElement.value, event);
    if (!hasMoved) {
      const dx = Math.abs(point.x - pressPoint.x);
      const dy = Math.abs(point.y - pressPoint.y);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }
      hasMoved = true;
      callbacks.onStart();
    }
    const wanted = { x: point.x - grabOffset.x, y: point.y - grabOffset.y };
    const position = keepInside(svgElement.value, wanted, VERTEX_RADIUS);
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
