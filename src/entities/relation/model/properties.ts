import type { Matrix, RelationKind } from "./types";

function has(matrix: Matrix, i: number, j: number): boolean {
  return matrix[i][j] !== 0;
}

export function isReflexive(matrix: Matrix): boolean {
  for (let i = 0; i < matrix.length; i++) {
    if (!has(matrix, i, i)) {
      return false;
    }
  }
  return true;
}

export function isSymmetric(matrix: Matrix): boolean {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (has(matrix, i, j) !== has(matrix, j, i)) {
        return false;
      }
    }
  }
  return true;
}

export function isAntisymmetric(matrix: Matrix): boolean {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (i !== j && has(matrix, i, j) && has(matrix, j, i)) {
        return false;
      }
    }
  }
  return true;
}

export function isAsymmetric(matrix: Matrix): boolean {
  for (let i = 0; i < matrix.length; i++) {
    if (has(matrix, i, i)) {
      return false;
    }
  }
  return isAntisymmetric(matrix);
}

export function isTransitive(matrix: Matrix): boolean {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (!has(matrix, i, j)) {
        continue;
      }
      for (let k = 0; k < matrix.length; k++) {
        if (has(matrix, j, k) && !has(matrix, i, k)) {
          return false;
        }
      }
    }
  }
  return true;
}

export function matchesKind(matrix: Matrix, kind: RelationKind): boolean {
  if (kind === "symmetric") {
    return isSymmetric(matrix);
  }
  if (kind === "antisymmetric") {
    return isAntisymmetric(matrix);
  }
  if (kind === "asymmetric") {
    return isAsymmetric(matrix);
  }
  return true;
}

export function isConnected(matrix: Matrix): boolean {
  if (matrix.length === 0) {
    return true;
  }
  const visited = [0];
  const queue = [0];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) {
      break;
    }
    for (let other = 0; other < matrix.length; other++) {
      const linked = has(matrix, current, other) || has(matrix, other, current);
      if (linked && !visited.includes(other)) {
        visited.push(other);
        queue.push(other);
      }
    }
  }
  return visited.length === matrix.length;
}
