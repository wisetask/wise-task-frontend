import { describe, expect, it } from "vitest";
import { CATEGORY_IDEAS, categoryIdeas, withStart } from "./suggestions";

describe("constructor suggestions", () => {
  it("offers categories that fit what is typed", () => {
    expect(categoryIdeas("")).toEqual(CATEGORY_IDEAS);
    expect(categoryIdeas("па")).toEqual(["Паросочетания"]);
    expect(categoryIdeas("Деревья")).toEqual([]);
    expect(categoryIdeas("рас")).toEqual(["Раскраска"]);
  });

  it("adds a starting phrase on a new line", () => {
    expect(withStart("", "Нарисуйте ")).toBe("Нарисуйте ");
    expect(withStart("Дан граф.  ", "Нарисуйте ")).toBe("Дан граф.\nНарисуйте ");
  });
});
