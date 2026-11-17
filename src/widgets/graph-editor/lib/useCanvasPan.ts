import { usePointerDrag } from "./usePointerDrag";

interface PanCallbacks {
  onPan: (dx: number, dy: number) => void;
}

export function useCanvasPan(callbacks: PanCallbacks) {
  const drag = usePointerDrag({
    onMove: (_event, dx, dy) => {
      callbacks.onPan(dx, dy);
    },
  });

  return {
    isPanning: drag.isDragging,
    startPan: drag.begin,
    consumeClick: drag.consumeClick,
  };
}
