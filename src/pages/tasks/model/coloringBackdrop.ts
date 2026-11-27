export const PAINT_WIDTH = 1000;
export const PAINT_HEIGHT = 600;
export const PAINT_COLORS = 4;

export const LATTICE_COLUMNS = 10;
const ROWS = 6;
const LINK_FACTOR = 1.35;

export interface PaintPoint {
  x: number;
  y: number;
}

export interface Coloring {
  colors: number[];
  clashes: number[];
  used: number;
}

export function paintRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state = state + 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function latticeStep(): number {
  return PAINT_WIDTH / LATTICE_COLUMNS;
}

export function latticePoints(seed: number): PaintPoint[] {
  const random = paintRandom(seed);
  const step = latticeStep();
  const rowStep = PAINT_HEIGHT / ROWS;
  const points: PaintPoint[] = [];
  for (let row = 0; row < ROWS; row++) {
    const shift = row % 2 === 0 ? 0 : step / 2;
    for (let column = 0; column < LATTICE_COLUMNS; column++) {
      const x = step / 4 + column * step + shift + (random() - 0.5) * step * 0.3;
      const y = rowStep / 2 + row * rowStep + (random() - 0.5) * rowStep * 0.3;
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  return points;
}

export function latticeEdges(points: PaintPoint[]): number[][] {
  const limit = latticeStep() * LINK_FACTOR;
  const edges: number[][] = [];
  for (let first = 0; first < points.length; first++) {
    for (let second = first + 1; second < points.length; second++) {
      const distance = Math.hypot(
        points[first].x - points[second].x,
        points[first].y - points[second].y,
      );
      if (distance <= limit) {
        edges.push([first, second]);
      }
    }
  }
  return edges;
}

export function neighbourLists(count: number, edges: number[][]): number[][] {
  const lists: number[][] = [];
  for (let index = 0; index < count; index++) {
    lists.push([]);
  }
  for (const edge of edges) {
    lists[edge[0]].push(edge[1]);
    lists[edge[1]].push(edge[0]);
  }
  return lists;
}

export function paintOrder(neighbours: number[][], start: number): number[] {
  const order: number[] = [start];
  const seen: boolean[] = [];
  for (let index = 0; index < neighbours.length; index++) {
    seen.push(index === start);
  }
  let head = 0;
  while (head < order.length) {
    const current = order[head];
    head = head + 1;
    for (const next of neighbours[current]) {
      if (!seen[next]) {
        seen[next] = true;
        order.push(next);
      }
    }
  }
  for (let index = 0; index < neighbours.length; index++) {
    if (!seen[index]) {
      order.push(index);
    }
  }
  return order;
}

export function greedyColoring(neighbours: number[][], order: number[]): Coloring {
  const colors: number[] = [];
  const clashes: number[] = [];
  for (let index = 0; index < neighbours.length; index++) {
    colors.push(-1);
    clashes.push(0);
  }
  let used = 0;
  for (const vertex of order) {
    const taken: boolean[] = [];
    for (const next of neighbours[vertex]) {
      if (colors[next] >= 0) {
        taken[colors[next]] = true;
      }
    }
    let color = 0;
    while (taken[color] === true) {
      color = color + 1;
    }
    colors[vertex] = color;
    clashes[vertex] = color;
    used = Math.max(used, color + 1);
  }
  return { colors: colors, clashes: clashes, used: used };
}

export function isProperColoring(neighbours: number[][], colors: number[]): boolean {
  for (let vertex = 0; vertex < neighbours.length; vertex++) {
    for (const next of neighbours[vertex]) {
      if (colors[vertex] === colors[next]) {
        return false;
      }
    }
  }
  return true;
}

export function nearestPoint(points: PaintPoint[], x: number, y: number, radius: number): number {
  let best = -1;
  let bestDistance = radius;
  for (let index = 0; index < points.length; index++) {
    const distance = Math.hypot(points[index].x - x, points[index].y - y);
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

export function colorsText(used: number): string {
  if (used === 1) {
    return "1 цвет";
  }
  if (used >= 2 && used <= 4) {
    return used + " цвета";
  }
  return used + " цветов";
}
