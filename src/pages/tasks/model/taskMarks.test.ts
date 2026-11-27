import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS, categoryColor, markTitle, taskMarks } from "./taskMarks";

describe("task marks", () => {
  it("marks solved tasks over tried ones", () => {
    const marks = taskMarks([
      { isCorrect: false, task: { id: "1" } },
      { isCorrect: true, task: { id: "1" } },
      { isCorrect: false, task: { id: "1" } },
      { isCorrect: false, task: { id: "2" } },
      { isCorrect: true, task: null },
    ]);
    expect(marks).toEqual({ "1": "solved", "2": "tried" });
  });

  it("names the marks", () => {
    expect(markTitle("solved")).toBe("Решена");
    expect(markTitle("tried")).toBe("Были попытки");
    expect(markTitle(undefined)).toBe("");
  });

  it("gives a category the same colour every time", () => {
    expect(categoryColor("Деревья")).toBe(categoryColor(" деревья "));
    expect(categoryColor("Деревья")).toBeLessThan(CATEGORY_COLORS);
    expect(categoryColor("")).toBe(0);
  });
});
