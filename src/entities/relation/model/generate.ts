import { emptyMatrix } from "./matrix";
import { isConnected } from "./properties";
import type { Matrix, RelationKind } from "./types";

export const MIN_SIZE = 3;
export const MAX_SIZE = 9;
const MAX_ATTEMPTS = 1000;

export function maxPairs(size: number, kind: RelationKind): number {
  if (kind === "symmetric" || kind === "antisymmetric") {
    return (size * (size + 1)) / 2;
  }
  if (kind === "asymmetric") {
    return (size * (size - 1)) / 2;
  }
  return size * size;
}

export function minPairs(size: number): number {
  return size - 1;
}

function canAdd(matrix: Matrix, i: number, j: number, kind: RelationKind): boolean {
  if (matrix[i][j] !== 0) {
    return false;
  }
  if (kind === "asymmetric" && i === j) {
    return false;
  }
  if ((kind === "antisymmetric" || kind === "asymmetric") && matrix[j][i] !== 0) {
    return false;
  }
  return true;
}

function randomIndex(count: number, random: () => number): number {
  return Math.min(count - 1, Math.floor(random() * count));
}

function freeCells(matrix: Matrix, kind: RelationKind): number[][] {
  const cells: number[][] = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (kind === "symmetric" && j < i) {
        continue;
      }
      if (canAdd(matrix, i, j, kind)) {
        cells.push([i, j]);
      }
    }
  }
  return cells;
}

function randomRelation(size: number, pairs: number, kind: RelationKind, random: () => number) {
  const matrix = emptyMatrix(size);
  for (let added = 0; added < pairs; added++) {
    const cells = freeCells(matrix, kind);
    const cell = cells[randomIndex(cells.length, random)];
    matrix[cell[0]][cell[1]] = 1;
    if (kind === "symmetric") {
      matrix[cell[1]][cell[0]] = 1;
    }
  }
  return matrix;
}

export function generateRelation(
  size: number,
  pairs: number,
  kind: RelationKind,
  random: () => number = Math.random,
): Matrix | null {
  if (size < MIN_SIZE || size > MAX_SIZE) {
    return null;
  }
  if (pairs < minPairs(size) || pairs > maxPairs(size, kind)) {
    return null;
  }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const matrix = randomRelation(size, pairs, kind, random);
    if (isConnected(matrix)) {
      return matrix;
    }
  }
  return null;
}
