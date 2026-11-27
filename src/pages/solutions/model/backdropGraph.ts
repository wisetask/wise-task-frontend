export interface Point {
  x: number;
  y: number;
}

export interface BfsResult {
  layer: number[];
  parent: number[];
}

export const BACKDROP_WIDTH = 1000;
export const BACKDROP_HEIGHT = 600;
export const BACKDROP_COLUMNS = 8;
export const BACKDROP_ROWS = 4;

export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state = state + 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function backdropPoints(seed: number): Point[] {
  const random = seededRandom(seed);
  const cellWidth = BACKDROP_WIDTH / BACKDROP_COLUMNS;
  const cellHeight = BACKDROP_HEIGHT / BACKDROP_ROWS;
  const points: Point[] = [];
  for (let row = 0; row < BACKDROP_ROWS; row++) {
    for (let column = 0; column < BACKDROP_COLUMNS; column++) {
      points.push({
        x: Math.round(column * cellWidth + cellWidth * (0.2 + random() * 0.6)),
        y: Math.round(row * cellHeight + cellHeight * (0.2 + random() * 0.6)),
      });
    }
  }
  return points;
}

function distance(first: Point, second: Point): number {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function nearestEdges(points: Point[], neighbours: number): number[][] {
  const known: Record<string, boolean> = {};
  const edges: number[][] = [];
  for (let index = 0; index < points.length; index++) {
    const others: number[] = [];
    for (let other = 0; other < points.length; other++) {
      if (other !== index) {
        others.push(other);
      }
    }
    others.sort(
      (first, second) =>
        distance(points[index], points[first]) - distance(points[index], points[second]),
    );
    for (const other of others.slice(0, neighbours)) {
      const from = Math.min(index, other);
      const to = Math.max(index, other);
      const key = from + "-" + to;
      if (!known[key]) {
        known[key] = true;
        edges.push([from, to]);
      }
    }
  }
  return edges;
}

export function breadthFirst(count: number, edges: number[][], start: number): BfsResult {
  const neighbours: number[][] = [];
  const layer: number[] = [];
  const parent: number[] = [];
  for (let index = 0; index < count; index++) {
    neighbours.push([]);
    layer.push(-1);
    parent.push(-1);
  }
  for (const edge of edges) {
    neighbours[edge[0]].push(edge[1]);
    neighbours[edge[1]].push(edge[0]);
  }
  layer[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head = head + 1;
    for (const next of neighbours[current]) {
      if (layer[next] === -1) {
        layer[next] = layer[current] + 1;
        parent[next] = current;
        queue.push(next);
      }
    }
  }
  return { layer: layer, parent: parent };
}

export function farthestNode(layer: number[]): number {
  let best = 0;
  for (let index = 1; index < layer.length; index++) {
    if (layer[index] > layer[best]) {
      best = index;
    }
  }
  return best;
}

export function pathTo(parent: number[], target: number): number[] {
  const path: number[] = [];
  let current = target;
  while (current !== -1) {
    path.unshift(current);
    current = parent[current];
  }
  return path;
}

export function pathLine(points: Point[], path: number[]): string {
  let line = "";
  for (let index = 0; index < path.length; index++) {
    const point = points[path[index]];
    line = line + (index === 0 ? "M" : " L") + point.x + " " + point.y;
  }
  return line;
}
