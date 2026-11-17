import type { Point } from "./geometry";
import { clamp } from "./pointer";

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.25;

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Area {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function createViewport(): Viewport {
  return { x: 0, y: 0, scale: 1 };
}

export function screenToWorld(viewport: Viewport, point: Point): Point {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  };
}

export function zoomAt(viewport: Viewport, center: Point, factor: number): Viewport {
  const scale = clamp(viewport.scale * factor, MIN_SCALE, MAX_SCALE);
  const world = screenToWorld(viewport, center);
  return {
    x: center.x - world.x * scale,
    y: center.y - world.y * scale,
    scale: scale,
  };
}

export function panBy(viewport: Viewport, dx: number, dy: number): Viewport {
  return { x: viewport.x + dx, y: viewport.y + dy, scale: viewport.scale };
}

const LINE_HEIGHT = 40;

export function wheelFactor(deltaY: number, deltaMode: number): number {
  let pixels = deltaY;
  if (deltaMode === 1) {
    pixels = deltaY * LINE_HEIGHT;
  }
  return Math.exp(-pixels * 0.0015);
}

export function viewportTransform(viewport: Viewport): string {
  return "translate(" + viewport.x + " " + viewport.y + ") scale(" + viewport.scale + ")";
}

export function zoomPercent(viewport: Viewport): number {
  return Math.round(viewport.scale * 100);
}

export function visibleArea(viewport: Viewport, width: number, height: number): Area {
  const topLeft = screenToWorld(viewport, { x: 0, y: 0 });
  const bottomRight = screenToWorld(viewport, { x: width, y: height });
  return {
    left: topLeft.x,
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
  };
}

export function keepInArea(point: Point, area: Area, margin: number): Point {
  return {
    x: clamp(point.x, area.left + margin, area.right - margin),
    y: clamp(point.y, area.top + margin, area.bottom - margin),
  };
}
