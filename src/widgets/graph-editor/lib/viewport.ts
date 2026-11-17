import type { Point } from "./geometry";
import { clamp } from "./pointer";

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.25;
export const FIT_PADDING = 60;
const FIT_MAX_SCALE = 1;

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

export function zoomToPercent(viewport: Viewport, center: Point, percent: number): Viewport {
  return zoomAt(viewport, center, percent / 100 / viewport.scale);
}

const PERCENT_PATTERN = /^\d+([.,]\d+)?\s*%?$/;

export function parseZoomPercent(text: string): number | null {
  const trimmed = text.trim();
  if (!PERCENT_PATTERN.test(trimmed)) {
    return null;
  }
  const digits = trimmed.replace("%", "").trim().replace(",", ".");
  const value = Number(digits);
  if (value <= 0) {
    return null;
  }
  return value;
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

export function pointsArea(points: Point[]): Area | null {
  if (points.length === 0) {
    return null;
  }
  const area = {
    left: points[0].x,
    top: points[0].y,
    right: points[0].x,
    bottom: points[0].y,
  };
  for (const point of points) {
    area.left = Math.min(area.left, point.x);
    area.top = Math.min(area.top, point.y);
    area.right = Math.max(area.right, point.x);
    area.bottom = Math.max(area.bottom, point.y);
  }
  return area;
}

export function fitArea(area: Area, width: number, height: number, padding: number): Viewport {
  const areaWidth = area.right - area.left + padding * 2;
  const areaHeight = area.bottom - area.top + padding * 2;
  const scale = clamp(Math.min(width / areaWidth, height / areaHeight), MIN_SCALE, FIT_MAX_SCALE);
  const centerX = (area.left + area.right) / 2;
  const centerY = (area.top + area.bottom) / 2;
  return {
    x: width / 2 - centerX * scale,
    y: height / 2 - centerY * scale,
    scale: scale,
  };
}

export function areaBetween(from: Point, to: Point): Area {
  return {
    left: Math.min(from.x, to.x),
    top: Math.min(from.y, to.y),
    right: Math.max(from.x, to.x),
    bottom: Math.max(from.y, to.y),
  };
}
