import { describe, expect, it } from "vitest";
import { generateRelation, maxPairs, minPairs } from "./generate";
import { isAsymmetric, isAntisymmetric, isConnected, isSymmetric } from "./properties";
import type { Matrix, RelationKind } from "./types";

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function countPairs(matrix: Matrix, kind: RelationKind): number {
  let count = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] !== 0 && (kind !== "symmetric" || j >= i)) {
        count = count + 1;
      }
    }
  }
  return count;
}

const KINDS: RelationKind[] = ["any", "symmetric", "antisymmetric", "asymmetric"];

describe("relation generation", () => {
  it("knows how many pairs a relation can have", () => {
    expect(maxPairs(4, "any")).toBe(16);
    expect(maxPairs(4, "symmetric")).toBe(10);
    expect(maxPairs(4, "antisymmetric")).toBe(10);
    expect(maxPairs(4, "asymmetric")).toBe(6);
    expect(minPairs(4)).toBe(3);
  });

  it("makes a connected relation of the asked kind and size", () => {
    for (const kind of KINDS) {
      for (let size = 3; size <= 9; size++) {
        for (const pairs of [minPairs(size), maxPairs(size, kind)]) {
          const matrix = generateRelation(size, pairs, kind, seededRandom(size * 31 + pairs));
          expect(matrix).not.toBeNull();
          if (matrix !== null) {
            expect(matrix.length).toBe(size);
            expect(countPairs(matrix, kind)).toBe(pairs);
            expect(isConnected(matrix)).toBe(true);
          }
        }
      }
    }
  });

  it("keeps the properties of each kind", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const symmetric = generateRelation(6, 9, "symmetric", seededRandom(seed));
      const antisymmetric = generateRelation(6, 9, "antisymmetric", seededRandom(seed));
      const asymmetric = generateRelation(6, 9, "asymmetric", seededRandom(seed));
      expect(symmetric !== null && isSymmetric(symmetric)).toBe(true);
      expect(antisymmetric !== null && isAntisymmetric(antisymmetric)).toBe(true);
      expect(asymmetric !== null && isAsymmetric(asymmetric)).toBe(true);
    }
  });

  it("refuses sizes and pair counts that are out of range", () => {
    expect(generateRelation(2, 1, "any")).toBeNull();
    expect(generateRelation(10, 9, "any")).toBeNull();
    expect(generateRelation(5, 3, "any")).toBeNull();
    expect(generateRelation(5, 11, "asymmetric")).toBeNull();
  });
});
