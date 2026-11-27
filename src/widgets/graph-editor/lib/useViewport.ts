import { computed, onBeforeUnmount, ref, type Ref } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import { VERTEX_RADIUS, type Point } from "./geometry";
import { blendViewport, easeOutCubic } from "./motionMath";
import { toCanvasPoint } from "./pointer";
import {
  createViewport,
  FIT_PADDING,
  fitArea,
  keepInArea,
  panBy,
  pointsArea,
  screenToWorld,
  viewportTransform,
  visibleArea,
  wheelGesture,
  worldToScreen,
  ZOOM_STEP,
  zoomAt,
  zoomPercent,
  zoomToPercent,
  type Viewport,
} from "./viewport";

const ZOOM_DURATION = 320;

export function useViewport(svgElement: Ref<SVGSVGElement | null>) {
  const viewport = ref<Viewport>(createViewport());
  let goal: Viewport | null = null;
  let frame = 0;

  function stopMoving() {
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    goal = null;
  }

  function latest(): Viewport {
    if (goal !== null) {
      return goal;
    }
    return viewport.value;
  }

  function moveTo(target: Viewport, animated: boolean) {
    stopMoving();
    if (!animated || !motionAllowed() || typeof window.requestAnimationFrame !== "function") {
      viewport.value = target;
      return;
    }
    const from = viewport.value;
    const startTime = performance.now();
    goal = target;
    function step(now: number) {
      const t = Math.min(1, (now - startTime) / ZOOM_DURATION);
      viewport.value = blendViewport(from, target, easeOutCubic(t));
      if (t < 1) {
        frame = window.requestAnimationFrame(step);
      } else {
        frame = 0;
        goal = null;
      }
    }
    frame = window.requestAnimationFrame(step);
  }

  onBeforeUnmount(stopMoving);

  const transform = computed(() => viewportTransform(viewport.value));
  const percent = computed(() => zoomPercent(viewport.value));

  function toWorld(event: MouseEvent): Point {
    return screenToWorld(viewport.value, toCanvasPoint(svgElement.value, event));
  }

  function limitToView(point: Point): Point {
    if (svgElement.value === null) {
      return point;
    }
    const box = svgElement.value.getBoundingClientRect();
    const area = visibleArea(viewport.value, box.width, box.height);
    return keepInArea(point, area, VERTEX_RADIUS);
  }

  function center(): Point {
    if (svgElement.value === null) {
      return { x: 0, y: 0 };
    }
    const box = svgElement.value.getBoundingClientRect();
    return { x: box.width / 2, y: box.height / 2 };
  }

  function zoomIn() {
    moveTo(zoomAt(latest(), center(), ZOOM_STEP), true);
  }

  function zoomOut() {
    moveTo(zoomAt(latest(), center(), 1 / ZOOM_STEP), true);
  }

  function setPercent(percent: number) {
    moveTo(zoomToPercent(latest(), center(), percent), true);
  }

  function toScreen(point: Point): Point {
    return worldToScreen(viewport.value, point);
  }

  function applyWheel(event: WheelEvent) {
    stopMoving();
    const gesture = wheelGesture(event);
    if (gesture.kind === "pan") {
      viewport.value = panBy(viewport.value, gesture.dx, gesture.dy);
      return;
    }
    const point = toCanvasPoint(svgElement.value, event);
    viewport.value = zoomAt(viewport.value, point, gesture.factor);
  }

  function pan(dx: number, dy: number) {
    stopMoving();
    viewport.value = panBy(viewport.value, dx, dy);
  }

  function reset() {
    moveTo(createViewport(), true);
  }

  function fitTo(points: Point[], animated: boolean) {
    const area = pointsArea(points);
    if (area === null || svgElement.value === null) {
      moveTo(createViewport(), animated);
      return;
    }
    const box = svgElement.value.getBoundingClientRect();
    moveTo(fitArea(area, box.width, box.height, FIT_PADDING), animated);
  }

  return {
    transform: transform,
    percent: percent,
    toWorld: toWorld,
    toScreen: toScreen,
    limitToView: limitToView,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    setPercent: setPercent,
    applyWheel: applyWheel,
    pan: pan,
    reset: reset,
    fitTo: fitTo,
  };
}
