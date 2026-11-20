import type { Point } from "./geometry";
import { usePointerDrag } from "./usePointerDrag";

interface EdgeDragCallbacks {
  toWorld: (event: MouseEvent) => Point;
  onStart: (sourceId: string) => void;
  onMove: (point: Point) => void;
  onDrop: (sourceId: string, point: Point) => void;
}

export function useEdgeDrag(callbacks: EdgeDragCallbacks) {
  let sourceId: string | null = null;
  let lastPoint: Point | null = null;
  let hasStarted = false;

  const drag = usePointerDrag({
    onStart: () => {
      if (sourceId !== null) {
        hasStarted = true;
        callbacks.onStart(sourceId);
      }
    },
    onMove: (event) => {
      lastPoint = callbacks.toWorld(event);
      callbacks.onMove(lastPoint);
    },
    onEnd: () => {
      if (hasStarted && sourceId !== null && lastPoint !== null) {
        callbacks.onDrop(sourceId, lastPoint);
      }
      sourceId = null;
      lastPoint = null;
      hasStarted = false;
    },
  });

  function startEdge(event: PointerEvent, vertexId: string) {
    sourceId = vertexId;
    lastPoint = null;
    hasStarted = false;
    drag.begin(event);
  }

  return {
    isDragging: drag.isDragging,
    startEdge: startEdge,
    consumeClick: drag.consumeClick,
  };
}
