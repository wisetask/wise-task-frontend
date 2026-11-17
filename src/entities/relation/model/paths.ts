import type { Matrix } from "./types";

export function pathsOfLength(
  matrix: Matrix,
  from: number,
  to: number,
  length: number,
): number[][] {
  const paths: number[][] = [];
  if (length < 1) {
    return paths;
  }

  function walk(path: number[]) {
    const last = path[path.length - 1];
    if (path.length === length + 1) {
      if (last === to) {
        paths.push(path.slice());
      }
      return;
    }
    for (let next = 0; next < matrix.length; next++) {
      if (matrix[last][next] !== 0) {
        path.push(next);
        walk(path);
        path.pop();
      }
    }
  }

  walk([from]);
  return paths;
}

export function pathWeight(matrix: Matrix, path: number[]): number {
  let weight = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    weight = weight + matrix[path[i]][path[i + 1]];
  }
  return weight;
}
