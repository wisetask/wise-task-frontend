import { describe, expect, it } from "vitest";
import {
  describePaths,
  hoverHint,
  MAX_POWER,
  MIN_POWER,
  powerOptions,
  powerTitle,
  progressText,
  toExponent,
  toMultiplyKind,
} from "./relationText";

describe("powerTitle", () => {
  it("writes the power as a superscript", () => {
    expect(powerTitle(2)).toBe("A²");
    expect(powerTitle(3)).toBe("A³");
    expect(powerTitle(4)).toBe("A⁴");
    expect(powerTitle(5)).toBe("A⁵");
  });

  it("falls back to a caret outside 2–5", () => {
    expect(powerTitle(7)).toBe("A^7");
  });
});

describe("powerOptions", () => {
  it("lists powers from 2 to 5", () => {
    const options = powerOptions();
    expect(options).toHaveLength(MAX_POWER - MIN_POWER + 1);
    expect(options[0]).toEqual({ value: "2", label: "A²" });
    expect(options[3]).toEqual({ value: "5", label: "A⁵" });
  });
});

describe("toMultiplyKind and toExponent", () => {
  it("reads the kind of multiplication", () => {
    expect(toMultiplyKind("logical")).toBe("logical");
    expect(toMultiplyKind("tropical")).toBe("tropical");
    expect(toMultiplyKind("classic")).toBe("classic");
    expect(toMultiplyKind("other")).toBe("classic");
  });

  it("keeps the power between 2 and 5", () => {
    expect(toExponent("3")).toBe(3);
    expect(toExponent("1")).toBe(2);
    expect(toExponent("9")).toBe(5);
    expect(toExponent("abc")).toBe(2);
    expect(toExponent("2.5")).toBe(2);
  });
});

describe("hoverHint", () => {
  it("asks to point at a cell", () => {
    expect(hoverHint(3)).toBe("Наведите на клетку A³, чтобы увидеть пути длины 3.");
  });
});

describe("describePaths", () => {
  it("numbers elements from 1", () => {
    const text = describePaths(
      0,
      3,
      [
        [0, 1, 3],
        [0, 2, 3],
      ],
      2,
      null,
    );
    expect(text).toBe("Из 1 в 4: 1 → 2 → 4, 1 → 3 → 4");
  });

  it("says so when there are no paths", () => {
    expect(describePaths(1, 2, [], 3, null)).toBe("Из 2 в 3 путей длины 3 нет.");
  });

  it("adds the weight of every path", () => {
    const text = describePaths(0, 2, [[0, 1, 2]], 2, [2]);
    expect(text).toBe("Из 1 в 3: 1 → 2 → 3 (вес 2)");
  });

  it("shortens a long list of paths", () => {
    const paths: number[][] = [];
    for (let i = 0; i < 13; i++) {
      paths.push([0, 1]);
    }
    const text = describePaths(0, 1, paths, 1, null);
    expect(text.endsWith("… и ещё 3")).toBe(true);
  });
});

describe("progressText", () => {
  it("shows filled cells and mistakes", () => {
    expect(progressText(12, 25, 2)).toBe("Заполнено 12 из 25, ошибок: 2");
  });
});
