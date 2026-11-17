import type { Point } from "./geometry";

export function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function toCanvasPoint(svg: SVGSVGElement | null, event: MouseEvent): Point {
  if (svg === null) {
    return { x: event.offsetX, y: event.offsetY };
  }
  const box = svg.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

export function isTyping(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}
