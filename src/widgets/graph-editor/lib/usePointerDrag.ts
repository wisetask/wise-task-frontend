import { onBeforeUnmount, ref } from "vue";

const DRAG_THRESHOLD = 3;

interface PointerDragCallbacks {
  onStart?: () => void;
  onMove: (event: PointerEvent, dx: number, dy: number) => void;
  onEnd?: () => void;
}

export function usePointerDrag(callbacks: PointerDragCallbacks) {
  const isDragging = ref(false);

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasMoved = false;
  let skipNextClick = false;

  function begin(event: PointerEvent) {
    startX = event.clientX;
    startY = event.clientY;
    lastX = event.clientX;
    lastY = event.clientY;
    hasMoved = false;
    skipNextClick = false;
    isDragging.value = true;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("blur", finish);
  }

  function onPointerMove(event: PointerEvent) {
    if (!hasMoved) {
      const farX = Math.abs(event.clientX - startX) >= DRAG_THRESHOLD;
      const farY = Math.abs(event.clientY - startY) >= DRAG_THRESHOLD;
      if (!farX && !farY) {
        return;
      }
      hasMoved = true;
      if (callbacks.onStart) {
        callbacks.onStart();
      }
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    callbacks.onMove(event, dx, dy);
  }

  function finish() {
    if (hasMoved) {
      skipNextClick = true;
    }
    hasMoved = false;
    isDragging.value = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    window.removeEventListener("blur", finish);
    if (callbacks.onEnd) {
      callbacks.onEnd();
    }
  }

  function consumeClick(): boolean {
    if (skipNextClick) {
      skipNextClick = false;
      return true;
    }
    return false;
  }

  onBeforeUnmount(() => {
    finish();
  });

  return {
    isDragging: isDragging,
    begin: begin,
    consumeClick: consumeClick,
  };
}
