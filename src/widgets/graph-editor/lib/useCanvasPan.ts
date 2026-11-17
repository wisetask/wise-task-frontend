import { onBeforeUnmount, ref } from "vue";

const PAN_THRESHOLD = 3;

interface PanCallbacks {
  onPan: (dx: number, dy: number) => void;
}

export function useCanvasPan(callbacks: PanCallbacks) {
  const isPanning = ref(false);

  let lastX = 0;
  let lastY = 0;
  let hasMoved = false;
  let skipNextClick = false;

  function startPan(event: PointerEvent) {
    lastX = event.clientX;
    lastY = event.clientY;
    hasMoved = false;
    skipNextClick = false;
    isPanning.value = true;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopPan);
  }

  function onPointerMove(event: PointerEvent) {
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (!hasMoved && Math.abs(dx) < PAN_THRESHOLD && Math.abs(dy) < PAN_THRESHOLD) {
      return;
    }
    hasMoved = true;
    lastX = event.clientX;
    lastY = event.clientY;
    callbacks.onPan(dx, dy);
  }

  function stopPan() {
    if (hasMoved) {
      skipNextClick = true;
    }
    hasMoved = false;
    isPanning.value = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopPan);
  }

  function consumeClick(): boolean {
    if (skipNextClick) {
      skipNextClick = false;
      return true;
    }
    return false;
  }

  onBeforeUnmount(() => {
    stopPan();
  });

  return {
    isPanning: isPanning,
    startPan: startPan,
    consumeClick: consumeClick,
  };
}
