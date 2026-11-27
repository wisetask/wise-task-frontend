export interface ScenePoint {
  x: number;
  y: number;
}

export interface SceneNode {
  id: number;
  x: number;
  y: number;
  phase: number;
  speed: number;
}

export interface SceneEdge {
  from: number;
  to: number;
}

export const SCENE_SIZE = 1000;
const MIN_GAP = 120;
const DRIFT = 16;

export function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function distance(first: ScenePoint, second: ScenePoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function buildNodes(count: number, seed: number): SceneNode[] {
  const random = createRandom(seed);
  const nodes: SceneNode[] = [];
  const margin = 90;
  let attempts = 0;
  while (nodes.length < count && attempts < count * 60) {
    attempts = attempts + 1;
    const candidate = {
      x: margin + random() * (SCENE_SIZE - margin * 2),
      y: margin + random() * (SCENE_SIZE - margin * 2),
    };
    let free = true;
    for (const node of nodes) {
      if (distance(node, candidate) < MIN_GAP) {
        free = false;
      }
    }
    if (free) {
      nodes.push({
        id: nodes.length,
        x: Math.round(candidate.x),
        y: Math.round(candidate.y),
        phase: random() * Math.PI * 2,
        speed: 0.3 + random() * 0.5,
      });
    }
  }
  return nodes;
}

function hasEdge(edges: SceneEdge[], first: number, second: number): boolean {
  for (const edge of edges) {
    if (
      (edge.from === first && edge.to === second) ||
      (edge.from === second && edge.to === first)
    ) {
      return true;
    }
  }
  return false;
}

export function nearestEdges(nodes: SceneNode[], perNode: number): SceneEdge[] {
  const edges: SceneEdge[] = [];
  for (const node of nodes) {
    const others = nodes.filter((other) => other.id !== node.id);
    others.sort((first, second) => distance(node, first) - distance(node, second));
    for (let i = 0; i < perNode && i < others.length; i++) {
      if (!hasEdge(edges, node.id, others[i].id)) {
        edges.push({ from: node.id, to: others[i].id });
      }
    }
  }
  return edges;
}

export function litOrder(nodes: SceneNode[], edges: SceneEdge[], start: number): number[] {
  const order: number[] = [];
  const seen: Record<number, boolean> = {};
  const queue = [start];
  seen[start] = true;
  while (queue.length > 0) {
    const current = queue.shift() as number;
    order.push(current);
    for (const edge of edges) {
      let next = -1;
      if (edge.from === current) {
        next = edge.to;
      } else if (edge.to === current) {
        next = edge.from;
      }
      if (next !== -1 && !seen[next]) {
        seen[next] = true;
        queue.push(next);
      }
    }
  }
  for (const node of nodes) {
    if (!seen[node.id]) {
      order.push(node.id);
    }
  }
  return order;
}

export function litCount(progress: number, total: number): number {
  if (progress <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(progress * total));
}

export function driftOffset(node: SceneNode, time: number): ScenePoint {
  return {
    x: Math.sin(time * node.speed + node.phase) * DRIFT,
    y: Math.cos(time * node.speed * 0.8 + node.phase) * DRIFT,
  };
}

// scale от 0 до 1 — насколько сейчас действует курсор: плавно растёт, когда курсор
// появился над графом, и плавно падает, когда ушёл, чтобы вершины не прыгали.
export function repelOffset(point: ScenePoint, pointer: ScenePoint | null, scale = 1): ScenePoint {
  const radius = 130;
  const strength = 12;
  if (pointer === null || scale <= 0) {
    return { x: 0, y: 0 };
  }
  const gap = distance(point, pointer);
  if (gap >= radius || gap === 0) {
    return { x: 0, y: 0 };
  }
  const push = ((radius - gap) / radius) * strength * scale;
  return {
    x: ((point.x - pointer.x) / gap) * push,
    y: ((point.y - pointer.y) / gap) * push,
  };
}

// Плавное приближение current к target. rate — насколько быстро (в долях за секунду),
// dt — прошедшее время в секундах. Не зависит от частоты кадров.
export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

export function nearestNode(points: ScenePoint[], pointer: ScenePoint, radius: number): number {
  let best = -1;
  let bestGap = radius;
  for (let i = 0; i < points.length; i++) {
    const gap = distance(points[i], pointer);
    if (gap <= bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  return best;
}
