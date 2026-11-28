import {
  generateRelation,
  MAX_SIZE,
  maxPairs,
  MIN_SIZE,
  minPairs,
  type Matrix,
  type RelationKind,
} from "@/entities/relation";
import type { UiSelectOption } from "@/shared/ui";

export const DEFAULT_KIND: RelationKind = "any";
export const DEFAULT_SIZE = 5;
export const DEFAULT_PAIRS = 7;

export const KIND_OPTIONS: UiSelectOption[] = [
  { value: "any", label: "Любое" },
  { value: "symmetric", label: "Симметричное" },
  { value: "antisymmetric", label: "Антисимметричное" },
  { value: "asymmetric", label: "Асимметричное" },
];

// Что просит страница у выбора отношения и что в итоге получилось
export interface GeneratedRelation {
  matrix: Matrix;
  kind: RelationKind;
  size: number;
  pairs: number;
}

export function toRelationKind(value: string): RelationKind {
  if (value === "symmetric" || value === "antisymmetric" || value === "asymmetric") {
    return value;
  }
  return "any";
}

export function kindDescription(kind: RelationKind): string {
  if (kind === "symmetric") {
    return "Симметричное: если есть пара (a, b), то есть и пара (b, a). Граф получается неориентированным, а пара a–b считается один раз. Петли можно.";
  }
  if (kind === "antisymmetric") {
    return "Антисимметричное: пары (a, b) и (b, a) одновременно бывают только при a = b. Петли можно.";
  }
  if (kind === "asymmetric") {
    return "Асимметричное: если есть пара (a, b), то пары (b, a) нет. Петель нет.";
  }
  return "Любое: произвольный набор пар, петли можно.";
}

export function sizeOptions(): UiSelectOption[] {
  const options: UiSelectOption[] = [];
  for (let size = MIN_SIZE; size <= MAX_SIZE; size++) {
    options.push({ value: String(size), label: String(size) });
  }
  return options;
}

export function pairsOptions(size: number, kind: RelationKind): UiSelectOption[] {
  const options: UiSelectOption[] = [];
  for (let pairs = minPairs(size); pairs <= maxPairs(size, kind); pairs++) {
    options.push({ value: String(pairs), label: String(pairs) });
  }
  return options;
}

// Число пар всегда в допустимых границах: слишком большое или малое прижимается к ближайшему.
export function clampPairs(pairs: number, size: number, kind: RelationKind): number {
  const lowest = minPairs(size);
  const highest = maxPairs(size, kind);
  if (pairs < lowest) {
    return lowest;
  }
  if (pairs > highest) {
    return highest;
  }
  return pairs;
}

// Отношение для первого открытия страницы: любое, 5 элементов, 7 пар.
// Если случайно собрать не вышло, берём цикл 1 → 2 → … → 5 → 1.
export function defaultRelation(): Matrix {
  const generated = generateRelation(DEFAULT_SIZE, DEFAULT_PAIRS, DEFAULT_KIND);
  if (generated !== null) {
    return generated;
  }
  const matrix: Matrix = [];
  for (let i = 0; i < DEFAULT_SIZE; i++) {
    const row: number[] = [];
    for (let j = 0; j < DEFAULT_SIZE; j++) {
      row.push(j === (i + 1) % DEFAULT_SIZE ? 1 : 0);
    }
    matrix.push(row);
  }
  return matrix;
}
