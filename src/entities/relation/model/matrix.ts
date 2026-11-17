import type { Matrix, MultiplyKind } from "./types";

export function emptyMatrix(size: number): Matrix {
  const matrix: Matrix = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(0);
    }
    matrix.push(row);
  }
  return matrix;
}

export function copyMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

export function sameMatrix(first: Matrix, second: Matrix): boolean {
  if (first.length !== second.length) {
    return false;
  }
  for (let i = 0; i < first.length; i++) {
    if (first[i].length !== second[i].length) {
      return false;
    }
    for (let j = 0; j < first[i].length; j++) {
      if (first[i][j] !== second[i][j]) {
        return false;
      }
    }
  }
  return true;
}

function classicCell(first: Matrix, second: Matrix, i: number, j: number): number {
  let sum = 0;
  for (let k = 0; k < second.length; k++) {
    sum = sum + first[i][k] * second[k][j];
  }
  return sum;
}

function logicalCell(first: Matrix, second: Matrix, i: number, j: number): number {
  for (let k = 0; k < second.length; k++) {
    if (first[i][k] !== 0 && second[k][j] !== 0) {
      return 1;
    }
  }
  return 0;
}

function tropicalCell(first: Matrix, second: Matrix, i: number, j: number): number {
  let best = 0;
  let found = false;
  for (let k = 0; k < second.length; k++) {
    if (first[i][k] !== 0 && second[k][j] !== 0) {
      const weight = first[i][k] + second[k][j];
      if (!found || weight > best) {
        best = weight;
        found = true;
      }
    }
  }
  return best;
}

export function multiplyCell(
  first: Matrix,
  second: Matrix,
  i: number,
  j: number,
  kind: MultiplyKind,
): number {
  if (kind === "logical") {
    return logicalCell(first, second, i, j);
  }
  if (kind === "tropical") {
    return tropicalCell(first, second, i, j);
  }
  return classicCell(first, second, i, j);
}

export function multiply(first: Matrix, second: Matrix, kind: MultiplyKind): Matrix {
  if (first.length > 0 && first[0].length !== second.length) {
    throw new Error("Число столбцов первой матрицы должно совпадать с числом строк второй");
  }
  const result: Matrix = [];
  for (let i = 0; i < first.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < second[0].length; j++) {
      row.push(multiplyCell(first, second, i, j, kind));
    }
    result.push(row);
  }
  return result;
}

export function power(matrix: Matrix, exponent: number, kind: MultiplyKind): Matrix {
  if (!Number.isInteger(exponent) || exponent < 1) {
    throw new Error("Степень должна быть целым числом от 1");
  }
  let result = copyMatrix(matrix);
  if (kind === "logical") {
    result = result.map((row) => row.map((value) => (value !== 0 ? 1 : 0)));
  }
  for (let step = 1; step < exponent; step++) {
    result = multiply(result, matrix, kind);
  }
  return result;
}
