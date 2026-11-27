import type { Graph } from "@/entities/graph";
import type { TemplateId } from "./graphTemplates";

export type SketchId = TemplateId | "envelope";

export interface Egg {
  id: string;
  text: string;
  sketch: SketchId | "";
}

function neighbourSets(graph: Graph): Map<string, Set<string>> {
  const sets = new Map<string, Set<string>>();
  for (const vertex of graph.vertices) {
    sets.set(vertex.id, new Set<string>());
  }
  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }
    const from = sets.get(edge.source);
    const to = sets.get(edge.target);
    if (from !== undefined && to !== undefined) {
      from.add(edge.target);
      to.add(edge.source);
    }
  }
  return sets;
}

function pairCount(sets: Map<string, Set<string>>): number {
  let total = 0;
  for (const set of sets.values()) {
    total = total + set.size;
  }
  return total / 2;
}

function allDegrees(sets: Map<string, Set<string>>, degree: number): boolean {
  for (const set of sets.values()) {
    if (set.size !== degree) {
      return false;
    }
  }
  return true;
}

function hasShortCycle(sets: Map<string, Set<string>>): boolean {
  const ids = Array.from(sets.keys());
  for (const first of ids) {
    const firstSet = sets.get(first);
    if (firstSet === undefined) {
      continue;
    }
    for (const second of ids) {
      if (second <= first) {
        continue;
      }
      const secondSet = sets.get(second);
      if (secondSet === undefined) {
        continue;
      }
      let common = 0;
      for (const id of firstSet) {
        if (secondSet.has(id)) {
          common = common + 1;
        }
      }
      if (common >= 2) {
        return true;
      }
      if (common >= 1 && firstSet.has(second)) {
        return true;
      }
    }
  }
  return false;
}

function isBipartiteThreeThree(sets: Map<string, Set<string>>): boolean {
  const ids = Array.from(sets.keys());
  const firstSet = sets.get(ids[0]);
  if (firstSet === undefined) {
    return false;
  }
  for (const id of ids) {
    const set = sets.get(id);
    if (set === undefined) {
      return false;
    }
    const sameSide = id === ids[0] || !firstSet.has(id);
    for (const other of set) {
      const otherSameSide = other === ids[0] || !firstSet.has(other);
      if (sameSide === otherSameSide) {
        return false;
      }
    }
  }
  return true;
}

export function graphEgg(graph: Graph): Egg | null {
  const sets = neighbourSets(graph);
  const count = graph.vertices.length;
  const pairs = pairCount(sets);
  if (count === 5 && pairs === 10) {
    return {
      id: "k5",
      text: "K₅ на чертеже. Куратовский напоминает: на плоскости без пересечений его не нарисовать.",
      sketch: "complete",
    };
  }
  if (count === 6 && pairs === 9 && allDegrees(sets, 3) && isBipartiteThreeThree(sets)) {
    return {
      id: "k33",
      text: "K₃,₃ — те самые три дома и три колодца. Без пересечений не выйдет, даже не пробуйте.",
      sketch: "bipartite",
    };
  }
  if (count === 10 && pairs === 15 && allDegrees(sets, 3) && !hasShortCycle(sets)) {
    return {
      id: "petersen",
      text: "Граф Петерсена! Любимый контрпример теории графов. Студенты запомнят эту задачу.",
      sketch: "petersen",
    };
  }
  if (count >= 50) {
    return {
      id: "big",
      text: "Больше 50 вершин. Студенты уже точат карандаши.",
      sketch: "",
    };
  }
  return null;
}

function hasWord(text: string, words: string[]): boolean {
  for (const word of words) {
    if (text.includes(word)) {
      return true;
    }
  }
  return false;
}

export function textEgg(name: string, description: string): Egg | null {
  const text = (name + " " + description).toLocaleLowerCase("ru").replace(/ё/g, "е");
  if (hasWord(text, ["кенигсберг", "семь мостов", "7 мостов"])) {
    return {
      id: "konigsberg",
      text: "Семь мостов Кёнигсберга. Эйлер давно доказал, что обойти нельзя, но студенты всё равно попробуют.",
      sketch: "",
    };
  }
  if (hasWord(text, ["конверт", "не отрывая", "одним росчерком"])) {
    return {
      id: "envelope",
      text: "Конверт одним росчерком — фон сейчас покажет, как это делается.",
      sketch: "envelope",
    };
  }
  if (hasWord(text, ["петерсен"])) {
    return {
      id: "petersen-name",
      text: "Петерсен в условии — значит, будет контрпример. Фон уже чертит его.",
      sketch: "petersen",
    };
  }
  if (hasWord(text, ["четыре краски", "4 краски", "четырех красок", "4 цвета"])) {
    return {
      id: "four-colors",
      text: "Четырёх красок хватает любой карте. Доказывали с компьютером, студентам можно карандашом.",
      sketch: "",
    };
  }
  if (hasWord(text, ["гамильтон"])) {
    return {
      id: "hamilton",
      text: "Гамильтонов цикл: проверить легко, найти трудно. Хорошая задача для честных людей.",
      sketch: "cube",
    };
  }
  return null;
}
