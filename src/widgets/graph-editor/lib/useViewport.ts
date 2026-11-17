import { computed, ref, type Ref } from "vue";
import { VERTEX_RADIUS, type Point } from "./geometry";
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
  wheelFactor,
  ZOOM_STEP,
  zoomAt,
  zoomPercent,
  zoomToPercent,
  type Viewport,
} from "./viewport";

export function useViewport(svgElement: Ref<SVGSVGElement | null>) {
  const viewport = ref<Viewport>(createViewport());

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
    viewport.value = zoomAt(viewport.value, center(), ZOOM_STEP);
  }

  function zoomOut() {
    viewport.value = zoomAt(viewport.value, center(), 1 / ZOOM_STEP);
  }

  function setPercent(percent: number) {
    viewport.value = zoomToPercent(viewport.value, center(), percent);
  }

  function zoomByWheel(event: WheelEvent) {
    const point = toCanvasPoint(svgElement.value, event);
    const factor = wheelFactor(event.deltaY, event.deltaMode);
    viewport.value = zoomAt(viewport.value, point, factor);
  }

  function pan(dx: number, dy: number) {
    viewport.value = panBy(viewport.value, dx, dy);
  }

  function reset() {
    viewport.value = createViewport();
  }

  function fitTo(points: Point[]) {
    const area = pointsArea(points);
    if (area === null || svgElement.value === null) {
      reset();
      return;
    }
    const box = svgElement.value.getBoundingClientRect();
    viewport.value = fitArea(area, box.width, box.height, FIT_PADDING);
  }

  return {
    transform: transform,
    percent: percent,
    toWorld: toWorld,
    limitToView: limitToView,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    setPercent: setPercent,
    zoomByWheel: zoomByWheel,
    pan: pan,
    reset: reset,
    fitTo: fitTo,
  };
}
