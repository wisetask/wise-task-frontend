export interface TreePoint {
  x: number;
  y: number;
}

export interface TreeEdge {
  from: number;
  to: number;
}

export const TREE_WIDTH = 1600;
export const TREE_HEIGHT = 1000;

export function createRandom(seed: number): () => number {
  let state = seed % 2147483648;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function distance(first: TreePoint, second: TreePoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function cloudPoints(count: number, seed: number, minGap: number): TreePoint[] {
  const random = createRandom(seed);
  const margin = 60;
  const points: TreePoint[] = [];
  let attempts = 0;
  while (points.length < count && attempts < count * 80) {
    attempts = attempts + 1;
    const candidate = {
      x: Math.round(margin + random() * (TREE_WIDTH - margin * 2)),
      y: Math.round(margin + random() * (TREE_HEIGHT - margin * 2)),
    };
    let free = true;
    for (const point of points) {
      if (distance(point, candidate) < minGap) {
        free = false;
      }
    }
    if (free) {
      points.push(candidate);
    }
  }
  return points;
}

export function primTree(points: TreePoint[], start: number): TreeEdge[] {
  const count = points.length;
  const inTree: boolean[] = [];
  const bestDistance: number[] = [];
  const bestFrom: number[] = [];
  for (let i = 0; i < count; i++) {
    inTree.push(false);
    bestDistance.push(Infinity);
    bestFrom.push(-1);
  }

  const edges: TreeEdge[] = [];
  if (count === 0) {
    return edges;
  }

  let current = start;
  inTree[current] = true;
  for (let step = 1; step < count; step++) {
    for (let i = 0; i < count; i++) {
      if (!inTree[i]) {
        const gap = distance(points[current], points[i]);
        if (gap < bestDistance[i]) {
          bestDistance[i] = gap;
          bestFrom[i] = current;
        }
      }
    }

    let next = -1;
    for (let i = 0; i < count; i++) {
      if (!inTree[i] && (next === -1 || bestDistance[i] < bestDistance[next])) {
        next = i;
      }
    }

    inTree[next] = true;
    edges.push({ from: bestFrom[next], to: next });
    current = next;
  }
  return edges;
}

export function treeWeight(points: TreePoint[], edges: TreeEdge[]): number {
  let total = 0;
  for (const edge of edges) {
    total = total + distance(points[edge.from], points[edge.to]);
  }
  return total;
}
