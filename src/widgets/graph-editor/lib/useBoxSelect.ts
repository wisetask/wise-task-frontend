import { computed, ref } from "vue";
import type { Point } from "./geometry";
import { usePointerDrag } from "./usePointerDrag";
import { areaBetween, type Area } from "./viewport";

interface BoxSelectCallbacks {
  toWorld: (event: MouseEvent) => Point;
  onSelect: (area: Area) => void;
}

export function useBoxSelect(callbacks: BoxSelectCallbacks) {
  const startPoint = ref<Point | null>(null);
  const currentPoint = ref<Point | null>(null);

  const drag = usePointerDrag({
    onMove: (event) => {
      currentPoint.value = callbacks.toWorld(event);
    },
    onEnd: () => {
      if (startPoint.value !== null && currentPoint.value !== null) {
        callbacks.onSelect(areaBetween(startPoint.value, currentPoint.value));
      }
      startPoint.value = null;
      currentPoint.value = null;
    },
  });

  const box = computed(() => {
    if (startPoint.value === null || currentPoint.value === null) {
      return null;
    }
    return areaBetween(startPoint.value, currentPoint.value);
  });

  function startBox(event: PointerEvent) {
    startPoint.value = callbacks.toWorld(event);
    currentPoint.value = null;
    drag.begin(event);
  }

  return {
    box: box,
    startBox: startBox,
    consumeClick: drag.consumeClick,
  };
}
