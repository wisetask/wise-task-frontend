import type { Graph } from "@/entities/graph";
import { simpleNeighbors, type SpecialGraph } from "./graphFacts";

export type CelebrationKind = SpecialGraph | "konami";

export interface VertexWave {
  key: number;
  steps: Record<string, number>;
}

export const CELEBRATION_TEXTS: Record<CelebrationKind, string> = {
  konami: "↑↑↓↓←→←→BA — граф пустился в пляс",
  petersen: "Граф Петерсена! Любимый контрпример теории графов",
  k5: "K₅: его не нарисовать на плоскости без пересечений",
  k33: "K₃,₃: задача о трёх домиках и трёх колодцах не решается",
};

export const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

export function createCodeWatcher(code: string[]) {
  const recent: string[] = [];

  function push(key: string): boolean {
    recent.push(key);
    if (recent.length > code.length) {
      recent.shift();
    }
    if (recent.length < code.length) {
      return false;
    }
    for (let i = 0; i < code.length; i++) {
      if (recent[i] !== code[i]) {
        return false;
      }
    }
    recent.length = 0;
    return true;
  }

  return {
    push: push,
  };
}

export function waveSteps(graph: Graph): Record<string, number> {
  const neighbors = simpleNeighbors(graph);
  const ordered = graph.vertices.slice();
  ordered.sort((first, second) => {
    if (first.x !== second.x) {
      return first.x - second.x;
    }
    return first.y - second.y;
  });
  const steps: Record<string, number> = {};
  for (const vertex of ordered) {
    if (steps[vertex.id] !== undefined) {
      continue;
    }
    steps[vertex.id] = 0;
    const queue = [vertex.id];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of neighbors[current]) {
        if (steps[next] === undefined) {
          steps[next] = steps[current] + 1;
          queue.push(next);
        }
      }
    }
  }
  return steps;
}
