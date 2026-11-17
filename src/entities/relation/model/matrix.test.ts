import { describe, expect, it } from "vitest";
import { copyMatrix, emptyMatrix, multiply, multiplyCell, power, sameMatrix } from "./matrix";
import { pathsOfLength, pathWeight } from "./paths";
import type { Matrix } from "./types";

function exampleRelation(): Matrix {
  const pairs = [
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [4, 5],
    [5, 1],
  ];
  const matrix = emptyMatrix(5);
  for (const pair of pairs) {
    matrix[pair[0] - 1][pair[1] - 1] = 1;
  }
  return matrix;
}

describe("relation matrices", () => {
  it("creates and copies matrices", () => {
    expect(emptyMatrix(2)).toEqual([
      [0, 0],
      [0, 0],
    ]);
    const matrix = exampleRelation();
    const copy = copyMatrix(matrix);
    copy[0][0] = 7;
    expect(matrix[0][0]).toBe(0);
    expect(sameMatrix(matrix, exampleRelation())).toBe(true);
    expect(sameMatrix(matrix, copy)).toBe(false);
    expect(sameMatrix(matrix, emptyMatrix(4))).toBe(false);
  });

  it("multiplies the classic way", () => {
    const first = [
      [1, 2],
      [3, 4],
    ];
    const second = [
      [5, 6],
      [7, 8],
    ];
    expect(multiply(first, second, "classic")).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it("multiplies the logical way", () => {
    const matrix = [
      [0, 1],
      [1, 0],
    ];
    expect(multiply(matrix, matrix, "logical")).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  it("multiplies the tropical way and keeps zero for no path", () => {
    const weights = [
      [0, 2, 5],
      [0, 0, 1],
      [0, 0, 0],
    ];
    const square = multiply(weights, weights, "tropical");
    expect(square[0][2]).toBe(3);
    expect(square[0][1]).toBe(0);
    expect(multiplyCell(weights, weights, 0, 2, "tropical")).toBe(3);
  });

  it("refuses matrices that do not fit", () => {
    expect(() => multiply([[1, 2]], [[1, 2]], "classic")).toThrow();
    expect(() => power(exampleRelation(), 0, "classic")).toThrow();
  });

  it("counts paths of length N with the classic power", () => {
    const matrix = exampleRelation();
    const square = power(matrix, 2, "classic");
    expect(square[0]).toEqual([0, 0, 1, 3, 1]);
    expect(square[1][3]).toBe(2);
    const cube = power(matrix, 3, "classic");
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        expect(cube[i][j]).toBe(pathsOfLength(matrix, i, j, 3).length);
      }
    }
  });

  it("lists the paths behind a cell", () => {
    const paths = pathsOfLength(exampleRelation(), 0, 3, 2);
    expect(paths).toEqual([
      [0, 1, 3],
      [0, 2, 3],
      [0, 3, 3],
    ]);
    expect(pathWeight(exampleRelation(), paths[0])).toBe(2);
    expect(pathsOfLength(exampleRelation(), 0, 3, 0)).toEqual([]);
  });

  it("shows only reachability with the logical power", () => {
    const matrix = exampleRelation();
    const classic = power(matrix, 3, "classic");
    const logical = power(matrix, 3, "logical");
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        expect(logical[i][j]).toBe(classic[i][j] > 0 ? 1 : 0);
      }
    }
  });

  it("gives the heaviest path with the tropical power", () => {
    const matrix = exampleRelation();
    const tropical = power(matrix, 2, "tropical");
    const classic = power(matrix, 2, "classic");
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        expect(tropical[i][j]).toBe(classic[i][j] > 0 ? 2 : 0);
      }
    }
  });

  it("returns a copy for the first power", () => {
    const matrix = exampleRelation();
    const first = power(matrix, 1, "classic");
    expect(first).toEqual(matrix);
    expect(first).not.toBe(matrix);
  });
});
