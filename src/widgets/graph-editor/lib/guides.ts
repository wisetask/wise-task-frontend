import type { Graph } from "@/entities/graph";
import type { Point } from "./geometry";

export interface Guide {
  vertical: boolean;
  position: number;
  from: number;
  to: number;
}

export interface GuideSnap {
  point: Point;
  guides: Guide[];
}

export const GUIDE_SNAP = 8;
const GUIDE_OVERHANG = 30;

function closest(values: number[], wanted: number, threshold: number): number | null {
  let best: number | null = null;
  let bestDistance = threshold;
  for (const value of values) {
    const distance = Math.abs(value - wanted);
    if (distance <= bestDistance) {
      best = value;
      bestDistance = distance;
    }
  }
  return best;
}

export function snapToGuides(
  graph: Graph,
  movingIds: string[],
  wanted: Point,
  threshold: number,
): GuideSnap {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const vertex of graph.vertices) {
    if (!movingIds.includes(vertex.id)) {
      xs.push(vertex.x);
      ys.push(vertex.y);
    }
  }
  const snapX = closest(xs, wanted.x, threshold);
  const snapY = closest(ys, wanted.y, threshold);
  const point = {
    x: snapX === null ? wanted.x : snapX,
    y: snapY === null ? wanted.y : snapY,
  };
  const guides: Guide[] = [];
  if (snapX !== null) {
    let from = point.y;
    let to = point.y;
    for (let i = 0; i < xs.length; i++) {
      if (xs[i] === snapX) {
        from = Math.min(from, ys[i]);
        to = Math.max(to, ys[i]);
      }
    }
    guides.push({
      vertical: true,
      position: snapX,
      from: from - GUIDE_OVERHANG,
      to: to + GUIDE_OVERHANG,
    });
  }
  if (snapY !== null) {
    let from = point.x;
    let to = point.x;
    for (let i = 0; i < ys.length; i++) {
      if (ys[i] === snapY) {
        from = Math.min(from, xs[i]);
        to = Math.max(to, xs[i]);
      }
    }
    guides.push({
      vertical: false,
      position: snapY,
      from: from - GUIDE_OVERHANG,
      to: to + GUIDE_OVERHANG,
    });
  }
  return { point: point, guides: guides };
}
