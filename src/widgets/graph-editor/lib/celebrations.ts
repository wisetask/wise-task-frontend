import { findVertex, type Graph } from "@/entities/graph";
import type { Point } from "./geometry";
import { simpleNeighbors, specialGraph, type SpecialGraph } from "./graphFacts";
import { eulerCircuit, grafWord, konigsbergLands, starShape } from "./graphShapes";

export type ShapeKind = SpecialGraph | "konigsberg" | "euler" | "graf" | "star";

export type CelebrationKind = ShapeKind | "konami" | "demon" | "stars" | "jackpot";

export interface Discovery {
  kind: ShapeKind;
  vertexIds: string[];
}

export type CanvasMood = "" | "stars" | "demon" | "jackpot";

export interface Comet {
  key: number;
  points: Point[];
  duration: number;
}

export interface VertexWave {
  key: number;
  steps: Record<string, number>;
}

export const CELEBRATION_TEXTS: Record<CelebrationKind, string> = {
  konami: "↑↑↓↓←→←→BA — граф пустился в пляс",
  petersen: "Граф Петерсена! Любимый контрпример теории графов",
  k5: "K₅: его не нарисовать на плоскости без пересечений",
  k33: "K₃,₃: задача о трёх домиках и трёх колодцах не решается",
  konigsberg: "Кёнигсбергские мосты! Эйлер доказал: пройти все семь по разу нельзя",
  euler: "Эйлеров цикл: комета прошла по каждому ребру ровно один раз",
  graf: "Г, Р, А, Ф — граф подписал сам себя",
  star: "Звезда! Листья водят хоровод вокруг центра",
  demon: "666… граф одержим. Сейчас отпустит",
  stars: "Созвездие Большого Графа",
  jackpot: "777 — джекпот! Все вершины выиграли по семёрке",
};

export const DEMON_CODE = ["6", "6", "6"];

export const JACKPOT_CODE = ["7", "7", "7"];

export const REEL_SYMBOLS = ["π", "∞", "Σ", "λ", "√", "∅", "★", "7"];

export function reelSymbol(index: number, tick: number, stopped: boolean): string {
  if (stopped) {
    return "7";
  }
  return REEL_SYMBOLS[(tick + index * 3) % REEL_SYMBOLS.length];
}

export function reelStopTime(index: number): number {
  return 1200 + Math.min(index * 110, 1100);
}

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

function allIds(graph: Graph): string[] {
  return graph.vertices.map((vertex) => vertex.id);
}

export function discoverShapes(graph: Graph): Discovery[] {
  const found: Discovery[] = [];
  const special = specialGraph(graph);
  if (special !== null) {
    found.push({ kind: special, vertexIds: allIds(graph) });
  }
  const lands = konigsbergLands(graph);
  if (lands !== null) {
    found.push({ kind: "konigsberg", vertexIds: lands });
  }
  const word = grafWord(graph);
  if (word !== null) {
    found.push({ kind: "graf", vertexIds: word });
  }
  const star = starShape(graph);
  if (star !== null) {
    found.push({ kind: "star", vertexIds: [star.centerId].concat(star.leafIds) });
  }
  const circuit = eulerCircuit(graph);
  if (circuit !== null) {
    found.push({ kind: "euler", vertexIds: circuit });
  }
  return found;
}

export function cometPoints(graph: Graph, vertexIds: string[]): Point[] {
  const points: Point[] = [];
  for (const id of vertexIds) {
    const vertex = findVertex(graph, id);
    if (vertex !== undefined) {
      points.push({ x: vertex.x, y: vertex.y });
    }
  }
  return points;
}

export function cometDuration(stepCount: number): number {
  const duration = stepCount * 280;
  if (duration < 1600) {
    return 1600;
  }
  if (duration > 7000) {
    return 7000;
  }
  return duration;
}
