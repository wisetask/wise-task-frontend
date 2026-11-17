import type { Matrix } from "@/entities/relation";

export type Answers = (number | null)[][];

export type CellState = "empty" | "filled" | "correct" | "wrong";

export interface CellPosition {
  row: number;
  col: number;
}

const NUMBER_PATTERN = /^\d+$/;

export function emptyAnswers(size: number): Answers {
  const answers: Answers = [];
  for (let i = 0; i < size; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < size; j++) {
      row.push(null);
    }
    answers.push(row);
  }
  return answers;
}

export function parseCell(text: string): number | null {
  const trimmed = text.trim();
  if (!NUMBER_PATTERN.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

export function withAnswer(answers: Answers, cell: CellPosition, value: number | null): Answers {
  return answers.map((row, i) =>
    row.map((old, j) => (i === cell.row && j === cell.col ? value : old)),
  );
}

export function cellState(
  answer: number | null,
  expected: number | null,
  showResult: boolean,
): CellState {
  if (answer === null) {
    return "empty";
  }
  if (!showResult || expected === null) {
    return "filled";
  }
  return answer === expected ? "correct" : "wrong";
}

export function countFilled(answers: Answers): number {
  let count = 0;
  for (const row of answers) {
    for (const value of row) {
      if (value !== null) {
        count = count + 1;
      }
    }
  }
  return count;
}

export function countMistakes(answers: Answers, expected: Matrix): number {
  let count = 0;
  for (let i = 0; i < answers.length; i++) {
    for (let j = 0; j < answers[i].length; j++) {
      const value = answers[i][j];
      if (value !== null && value !== expected[i][j]) {
        count = count + 1;
      }
    }
  }
  return count;
}

export function isSolved(answers: Answers, expected: Matrix): boolean {
  for (let i = 0; i < expected.length; i++) {
    for (let j = 0; j < expected[i].length; j++) {
      if (answers[i][j] !== expected[i][j]) {
        return false;
      }
    }
  }
  return true;
}

export function nextCell(cell: CellPosition, key: string, size: number): CellPosition | null {
  let row = cell.row;
  let col = cell.col;
  if (key === "ArrowUp") {
    row = row - 1;
  } else if (key === "ArrowDown") {
    row = row + 1;
  } else if (key === "ArrowLeft") {
    col = col - 1;
  } else if (key === "ArrowRight") {
    col = col + 1;
  } else if (key === "Enter") {
    col = col + 1;
    if (col === size) {
      col = 0;
      row = row + 1;
    }
  } else {
    return null;
  }
  if (row < 0 || row >= size || col < 0 || col >= size) {
    return null;
  }
  return { row: row, col: col };
}
