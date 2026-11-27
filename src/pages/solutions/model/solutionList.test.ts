import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import {
  attemptsText,
  emptySolutionsText,
  groupCategories,
  groupMatches,
  groupSolutions,
  groupSummary,
  groupsFoundText,
  loadSolutionsErrorText,
  shownDots,
  stuckGroups,
  toSolutionItem,
  type SolutionListItem,
} from "./solutionList";

function solution(id: string, taskId: string | null, isCorrect: boolean): SolutionListItem {
  return {
    id: id,
    taskId: taskId,
    taskName: taskId === null ? "Задача удалена" : "Задача " + taskId,
    category: taskId === "t1" ? "Деревья" : "Раскраска",
    isCorrect: isCorrect,
    isGraph: true,
  };
}

describe("solution list", () => {
  it("makes a list item from the backend solution", () => {
    const item = toSolutionItem({
      __typename: "SolutionGraph",
      id: "s1",
      isCorrect: true,
      task: { id: "t1", name: "Раскраска", category: "Раскраска графов" },
    });
    expect(item).toEqual({
      id: "s1",
      taskId: "t1",
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
    expect(item.taskId).toBeNull();
    expect(item.isGraph).toBe(false);
  });

  it("groups attempts by task, newest task first", () => {
    const groups = groupSolutions([
      solution("s1", "t1", false),
      solution("s2", "t2", false),
      solution("s3", "t1", true),
      solution("s4", null, false),
      solution("s5", "t2", false),
    ]);
    expect(groups.length).toBe(3);
    expect(groups[0].taskId).toBe("t2");
    expect(groups[0].attempts.length).toBe(2);
    expect(groups[0].solved).toBe(false);
    expect(groups[0].lastId).toBe("s5");
    expect(groups[1].taskId).toBeNull();
    expect(groups[2].taskId).toBe("t1");
    expect(groups[2].solved).toBe(true);
    expect(groups[2].lastCorrect).toBe(true);
  });

  it("filters groups by state, name and category", () => {
    const groups = groupSolutions([solution("s1", "t1", true), solution("s2", "t2", false)]);
    expect(groupMatches(groups[1], "solved", "", "")).toBe(true);
    expect(groupMatches(groups[1], "unsolved", "", "")).toBe(false);
    expect(groupMatches(groups[0], "unsolved", "задача T2", "")).toBe(true);
    expect(groupMatches(groups[0], "all", "нет такой", "")).toBe(false);
    expect(groupMatches(groups[0], "all", "", "Деревья")).toBe(false);
  });

  it("lists categories by how often they appear", () => {
    const groups = groupSolutions([
      solution("s1", "t1", true),
      solution("s2", "t2", false),
      solution("s3", "t3", false),
    ]);
    expect(groupCategories(groups, 5)).toEqual(["Раскраска", "Деревья"]);
    expect(groupCategories(groups, 1)).toEqual(["Раскраска"]);
  });

  it("finds unsolved tasks with the most attempts", () => {
    const groups = groupSolutions([
      solution("s1", "t1", false),
      solution("s2", "t2", false),
      solution("s3", "t2", false),
      solution("s4", "t3", true),
    ]);
    const stuck = stuckGroups(groups, 5);
    expect(stuck.length).toBe(2);
    expect(stuck[0].taskId).toBe("t2");
  });

  it("shows only the last attempts as dots", () => {
    const attempts: { id: string; isCorrect: boolean }[] = [];
    for (let index = 0; index < 15; index++) {
      attempts.push({ id: String(index), isCorrect: false });
    }
    const shown = shownDots(attempts, 12);
    expect(shown.hidden).toBe(3);
    expect(shown.dots.length).toBe(12);
    expect(shown.dots[0].id).toBe("3");
    expect(shownDots(attempts.slice(0, 2), 12).hidden).toBe(0);
  });

  it("describes the attempts in words", () => {
    expect(attemptsText(1)).toBe("1 попытка");
    expect(attemptsText(3)).toBe("3 попытки");
    expect(attemptsText(11)).toBe("11 попыток");
    expect(groupsFoundText(21)).toBe("Найдено 21 задача");
    const once = groupSolutions([solution("s1", "t1", true)]);
    expect(groupSummary(once[0])).toBe("Решена с первой попытки");
    const third = groupSolutions([
      solution("s1", "t1", false),
      solution("s2", "t1", false),
      solution("s3", "t1", true),
    ]);
    expect(groupSummary(third[0])).toBe("Решена с 3-й попытки");
    const none = groupSolutions([solution("s1", "t1", false)]);
    expect(groupSummary(none[0])).toBe("Пока не решена");
  });

  it("explains an empty list", () => {
    expect(emptySolutionsText("all", false)).toContain("ещё не решали");
    expect(emptySolutionsText("solved", false)).toBe("Решённых задач пока нет.");
    expect(emptySolutionsText("all", true)).toBe("По этому запросу ничего не нашлось.");
  });

  it("tells a network problem from other errors", () => {
    const network = new ApolloError({ networkError: new Error("Failed to fetch") });
    expect(loadSolutionsErrorText(network)).toBe("Нет связи с сервером.");
    expect(loadSolutionsErrorText(new Error("что-то"))).toBe("Не получилось загрузить решения.");
  });
});
