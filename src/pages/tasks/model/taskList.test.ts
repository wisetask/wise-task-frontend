import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import {
  DESCRIPTION_LENGTH,
  emptyFilter,
  emptyListText,
  filterValue,
  isFilterEmpty,
  loadErrorText,
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
