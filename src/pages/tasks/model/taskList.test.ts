import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import {
  DESCRIPTION_LENGTH,
  emptyFilter,
  emptyListText,
  filterFromQuery,
  filterValue,
  foundText,
  highlightParts,
  isFilterEmpty,
  loadErrorText,
  popularCategories,
  queryFromFilter,
  shortDescription,
  toListItem,
} from "./taskList";

describe("task list", () => {
  it("sends only filled filter fields", () => {
    expect(filterValue("  ")).toBeNull();
    expect(filterValue(" Деревья ")).toBe("Деревья");
    expect(isFilterEmpty(emptyFilter())).toBe(true);
    expect(isFilterEmpty({ name: "", category: "Деревья" })).toBe(false);
  });

  it("keeps a short description as one line", () => {
    expect(shortDescription("Нарисуйте\n  дерево")).toBe("Нарисуйте дерево");
  });

  it("cuts a long description by words", () => {
    const long = "слово ".repeat(60);
    const short = shortDescription(long);
    expect(short.length <= DESCRIPTION_LENGTH + 1).toBe(true);
    expect(short.endsWith("…")).toBe(true);
    expect(short.endsWith(" …")).toBe(false);
  });

  it("makes a list item from the backend task", () => {
    const item = toListItem({
      id: "7",
      name: "Остов",
      description: "Найдите остовное дерево",
      category: "Деревья",
      isPublic: false,
      author: { firstName: "Иван", lastName: "Петров" },
    });
    expect(item).toEqual({
      id: "7",
      name: "Остов",
      category: "Деревья",
      description: "Найдите остовное дерево",
      fullDescription: "Найдите остовное дерево",
      author: "Петров Иван",
      isPublic: false,
    });
    const noAuthor = toListItem({
      id: "8",
      name: "Путь",
      description: "",
      category: "Пути",
      isPublic: true,
      author: null,
    });
    expect(noAuthor.author).toBe("");
  });

  it("explains an empty list", () => {
    expect(emptyListText(emptyFilter())).toBe("Задач пока нет.");
    expect(emptyListText({ name: "граф", category: "" })).toContain("не нашлось");
  });

  it("tells a network problem from other errors", () => {
    const network = new ApolloError({ networkError: new Error("Failed to fetch") });
    expect(loadErrorText(network)).toBe("Нет связи с сервером.");
    expect(loadErrorText(new Error("что-то"))).toBe("Не получилось загрузить задачи.");
  });
});

describe("task search helpers", () => {
  it("marks every match regardless of case", () => {
    expect(highlightParts("Остовное дерево и дерево", "ДЕРЕВО")).toEqual([
      { text: "Остовное ", match: false },
      { text: "дерево", match: true },
      { text: " и ", match: false },
      { text: "дерево", match: true },
    ]);
    expect(highlightParts("Граф", " ")).toEqual([{ text: "Граф", match: false }]);
  });

  it("says how many tasks were found in proper Russian", () => {
    expect(foundText(1)).toBe("Найдено 1 задача");
    expect(foundText(3)).toBe("Найдено 3 задачи");
    expect(foundText(12)).toBe("Найдено 12 задач");
    expect(foundText(1655)).toBe("Найдено 1655 задач");
    expect(foundText(21)).toBe("Найдено 21 задача");
  });

  it("picks the most common categories", () => {
    function item(category: string) {
      return toListItem({
        id: "1",
        name: "a",
        description: "",
        category: category,
        isPublic: true,
      });
    }
    const base = item("Деревья");
    const other = item("Раскраска");
    const empty = item(" ");
    expect(popularCategories([other, base, base, empty], 5)).toEqual(["Деревья", "Раскраска"]);
    expect(popularCategories([other, base, base], 1)).toEqual(["Деревья"]);
  });

  it("keeps the search in the address", () => {
    expect(filterFromQuery({ q: "дерево", category: 5 })).toEqual({ name: "дерево", category: "" });
    expect(queryFromFilter({ name: " дерево ", category: "" })).toEqual({ q: "дерево" });
    expect(queryFromFilter(emptyFilter())).toEqual({});
  });
});
