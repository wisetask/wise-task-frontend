import { describe, expect, it } from "vitest";
import {
  isAntisymmetric,
  isAsymmetric,
  isConnected,
  isReflexive,
  isSymmetric,
  isTransitive,
  matchesKind,
} from "./properties";

const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const CHAIN = [
  [0, 1, 0],
  [0, 0, 1],
  [0, 0, 0],
];

const ORDER = [
  [1, 1, 1],
  [0, 1, 1],
  [0, 0, 1],
];

describe("relation properties", () => {
  it("checks reflexivity and symmetry", () => {
    expect(isReflexive(IDENTITY)).toBe(true);
    expect(isReflexive(CHAIN)).toBe(false);
    expect(isSymmetric(IDENTITY)).toBe(true);
    expect(isSymmetric(CHAIN)).toBe(false);
  });

  it("tells antisymmetric from asymmetric", () => {
    expect(isAntisymmetric(ORDER)).toBe(true);
    expect(isAsymmetric(ORDER)).toBe(false);
    expect(isAsymmetric(CHAIN)).toBe(true);
    const both = [
      [0, 1],
      [1, 0],
    ];
    expect(isAntisymmetric(both)).toBe(false);
  });

  it("checks transitivity", () => {
    expect(isTransitive(ORDER)).toBe(true);
    expect(isTransitive(CHAIN)).toBe(false);
  });

  it("matches a relation with its kind", () => {
    expect(matchesKind(CHAIN, "any")).toBe(true);
    expect(matchesKind(CHAIN, "asymmetric")).toBe(true);
    expect(matchesKind(CHAIN, "symmetric")).toBe(false);
  });

  it("checks that the graph of the relation is connected", () => {
    expect(isConnected(CHAIN)).toBe(true);
    expect(isConnected(IDENTITY)).toBe(false);
    expect(isConnected([])).toBe(true);
  });
});
