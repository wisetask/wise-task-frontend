import type { ReadinessItem } from "./taskDraft";

export const RING_RADIUS = 34;

export interface ReadinessShare {
  done: number;
  total: number;
  percent: number;
}

export function readinessShare(items: readonly ReadinessItem[]): ReadinessShare {
  let done = 0;
  for (const item of items) {
    if (item.isDone) {
      done = done + 1;
    }
  }
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done: done, total: total, percent: percent };
}

export function ringLength(radius: number): number {
  return 2 * Math.PI * radius;
}

export function ringOffset(percent: number, radius: number): number {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return ringLength(radius) * (1 - clamped / 100);
}

export function readinessMood(share: ReadinessShare): string {
  if (share.total > 0 && share.done === share.total) {
    return "Можно создавать";
  }
  if (share.done === 0) {
    return "Чистый лист";
  }
  if (share.percent >= 60) {
    return "Почти готово";
  }
  return "В работе";
}
