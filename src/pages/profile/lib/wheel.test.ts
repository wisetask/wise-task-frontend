import { describe, expect, it } from "vitest";
import {
  MAX_RIM,
  MIN_RIM,
  chromaticNumber,
  farewellFact,
  rimLetters,
  rimSize,
  wheelColoring,
  wheelFacts,
  wheelGraph,
} from "./wheel";

describe("rimLetters", () => {
  it("spells the name in capitals", () => {
    expect(rimLetters("настя", 5)).toEqual(["Н", "А", "С", "Т", "Я"]);
  });

  it("fills the rest with dots", () => {
    expect(rimLetters("Ян", 5)).toEqual(["Я", "Н", "·", "·", "·"]);
  });

  it("keeps only as many letters as there are vertices", () => {
    expect(rimLetters("Константиновна", 12).length).toBe(12);
  });
});

describe("wheelColoring", () => {
  function isProper(rim: number): boolean {
    const coloring = wheelColoring(rim);
    for (let i = 0; i < rim; i++) {
      const next = (i + 1) % rim;
      if (coloring.rim[i] === coloring.rim[next] || coloring.rim[i] === coloring.center) {
        return false;
      }
    }
    return true;
  }

  it("gives neighbours different colours for every rim size", () => {
    for (let rim = MIN_RIM; rim <= MAX_RIM; rim++) {
      expect(isProper(rim)).toBe(true);
    }
  });

  it("uses 3 colours for an even rim and 4 for an odd one", () => {
    expect(new Set(wheelColoring(6).rim.concat([0])).size).toBe(chromaticNumber(6));
    expect(new Set(wheelColoring(5).rim.concat([0])).size).toBe(chromaticNumber(5));
    expect(chromaticNumber(6)).toBe(3);
    expect(chromaticNumber(5)).toBe(4);
  });
});

describe("farewellFact", () => {
  it("names the cycle left without the centre", () => {
    expect(farewellFact(5)).toBe("Без центра W6 — просто цикл C5. До встречи!");
  });
});

describe("wheelFacts", () => {
  it("counts vertices and edges", () => {
    expect(wheelFacts(5)[1]).toBe("У W6 6 вершин и 10 рёбер: 5 спиц и обод");
    expect(wheelFacts(11)[1]).toBe("У W12 12 вершин и 22 ребра: 11 спиц и обод");
    expect(wheelFacts(12)[1]).toBe("У W13 13 вершин и 24 ребра: 12 спиц и обод");
  });
});

describe("rimSize", () => {
  it("gives one vertex per letter of the first name", () => {
    expect(rimSize("Настя")).toBe(5);
    expect(rimSize("Анастасия")).toBe(9);
  });

  it("keeps the wheel between 5 and 12 vertices", () => {
    expect(rimSize("")).toBe(MIN_RIM);
    expect(rimSize("Ян")).toBe(MIN_RIM);
    expect(rimSize("Константиновна")).toBe(MAX_RIM);
  });

  it("ignores spaces around the name", () => {
    expect(rimSize("  Анна  ")).toBe(MIN_RIM);
  });
});

describe("wheelGraph", () => {
  it("puts the rim on a circle, starting from the top", () => {
    const wheel = wheelGraph(4, { x: 100, y: 100 }, 50);
    expect(wheel.rim).toEqual([
      { x: 100, y: 50 },
      { x: 150, y: 100 },
      { x: 100, y: 150 },
      { x: 50, y: 100 },
    ]);
  });

  it("closes the rim into a cycle", () => {
    const wheel = wheelGraph(5, { x: 0, y: 0 }, 10);
    expect(wheel.rimEdges.length).toBe(5);
    expect(wheel.rimEdges[4]).toEqual([4, 0]);
  });
});
