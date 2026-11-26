import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import {
  emptySolutionsText,
  filterToCorrect,
  keepForFilter,
  wrongCount,
  loadSolutionsErrorText,
  toSolutionItem,
} from "./solutionList";

describe("solution list", () => {
  it("turns the filter into the backend isCorrect", () => {
    expect(filterToCorrect("all")).toBeNull();
    expect(filterToCorrect("correct")).toBe(true);
    expect(filterToCorrect("wrong")).toBeNull();
  });

  it("drops correct solutions on the page for the wrong filter", () => {
    const correct = toSolutionItem({ id: "s1", isCorrect: true, task: null });
    const wrong = toSolutionItem({ id: "s2", isCorrect: false, task: null });
    expect(keepForFilter(correct, "wrong")).toBe(false);
    expect(keepForFilter(wrong, "wrong")).toBe(true);
    expect(keepForFilter(correct, "all")).toBe(true);
  });

  it("makes a list item from the backend solution", () => {
    const item = toSolutionItem({
      __typename: "SolutionGraph",
      id: "s1",
      isCorrect: true,
      task: { id: "t1", name: "Раскраска", category: "Раскраска графов" },
    });
    expect(item).toEqual({
      id: "s1",
      taskName: "Раскраска",
      category: "Раскраска графов",
      isCorrect: true,
      isGraph: true,
    });
  });

  it("keeps a solution whose task was deleted", () => {
    const item = toSolutionItem({
      __typename: "SolutionImplementation",
      id: "s2",
      isCorrect: false,
      task: null,
    });
    expect(item.taskName).toBe("Задача удалена");
    expect(item.category).toBe("");
    expect(item.isGraph).toBe(false);
  });

  it("counts wrong solutions as all minus correct", () => {
    expect(wrongCount(5, 2)).toBe(3);
    expect(wrongCount(null, 2)).toBeNull();
    expect(wrongCount(5, null)).toBeNull();
  });

  it("explains an empty list for each filter", () => {
    expect(emptySolutionsText("all")).toContain("ещё не решали");
    expect(emptySolutionsText("correct")).toBe("Верных решений пока нет.");
    expect(emptySolutionsText("wrong")).toBe("Неверных решений нет.");
  });

  it("tells a network problem from other errors", () => {
    const network = new ApolloError({ networkError: new Error("Failed to fetch") });
    expect(loadSolutionsErrorText(network)).toBe("Нет связи с сервером.");
    expect(loadSolutionsErrorText(new Error("что-то"))).toBe("Не получилось загрузить решения.");
  });
});
