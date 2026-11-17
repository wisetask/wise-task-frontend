import { describe, expect, it } from "vitest";
import {
  cellState,
  countFilled,
  countMistakes,
  emptyAnswers,
  isSolved,
  nextCell,
  parseCell,
  withAnswer,
} from "./cells";

describe("relation matrix cells", () => {
  it("starts with an empty grid", () => {
    expect(emptyAnswers(2)).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it("reads whole non-negative numbers only", () => {
    expect(parseCell("3")).toBe(3);
    expect(parseCell(" 12 ")).toBe(12);
    expect(parseCell("0")).toBe(0);
    expect(parseCell("")).toBeNull();
    expect(parseCell("-1")).toBeNull();
    expect(parseCell("2.5")).toBeNull();
    expect(parseCell("x")).toBeNull();
  });

  it("changes one answer without touching the old grid", () => {
    const answers = emptyAnswers(2);
    const changed = withAnswer(answers, { row: 1, col: 0 }, 4);
    expect(changed[1][0]).toBe(4);
    expect(answers[1][0]).toBeNull();
  });

  it("colors a cell only when results are shown", () => {
    expect(cellState(null, 2, true)).toBe("empty");
    expect(cellState(2, 2, false)).toBe("filled");
    expect(cellState(2, 2, true)).toBe("correct");
    expect(cellState(3, 2, true)).toBe("wrong");
    expect(cellState(3, null, true)).toBe("filled");
  });

  it("counts filled cells and mistakes and knows when the grid is solved", () => {
    const expected = [
      [1, 0],
      [2, 1],
    ];
    let answers = emptyAnswers(2);
    answers = withAnswer(answers, { row: 0, col: 0 }, 1);
    answers = withAnswer(answers, { row: 1, col: 0 }, 3);
    expect(countFilled(answers)).toBe(2);
    expect(countMistakes(answers, expected)).toBe(1);
    expect(isSolved(answers, expected)).toBe(false);
    answers = withAnswer(answers, { row: 1, col: 0 }, 2);
    answers = withAnswer(answers, { row: 0, col: 1 }, 0);
    answers = withAnswer(answers, { row: 1, col: 1 }, 1);
    expect(isSolved(answers, expected)).toBe(true);
  });

  it("moves between cells with arrows and Enter", () => {
    expect(nextCell({ row: 1, col: 1 }, "ArrowUp", 3)).toEqual({ row: 0, col: 1 });
    expect(nextCell({ row: 1, col: 1 }, "ArrowRight", 3)).toEqual({ row: 1, col: 2 });
    expect(nextCell({ row: 0, col: 2 }, "Enter", 3)).toEqual({ row: 1, col: 0 });
    expect(nextCell({ row: 0, col: 0 }, "ArrowLeft", 3)).toBeNull();
    expect(nextCell({ row: 2, col: 2 }, "Enter", 3)).toBeNull();
    expect(nextCell({ row: 0, col: 0 }, "a", 3)).toBeNull();
  });
});
