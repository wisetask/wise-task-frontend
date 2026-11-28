import { describe, expect, it } from "vitest";
import { isSectionActive, visibleSections } from "./sections";

function titles(role: string | null): string[] {
  const result: string[] = [];
  for (const section of visibleSections(role)) {
    result.push(section.title);
  }
  return result;
}

describe("visibleSections", () => {
  it("shows three sections to a guest", () => {
    expect(titles(null)).toEqual(["Треки", "Задачи", "Библиотека графов"]);
  });

  it("adds «Мои решения» for a signed-in user", () => {
    expect(titles("USER")).toEqual(["Треки", "Задачи", "Библиотека графов", "Мои решения"]);
  });

  it("adds «Конструктор задач» for an author", () => {
    expect(titles("AUTHOR")).toEqual([
      "Треки",
      "Задачи",
      "Библиотека графов",
      "Мои решения",
      "Конструктор задач",
    ]);
  });

  it("shows everything to an admin", () => {
    expect(titles("ADMIN")).toEqual([
      "Треки",
      "Задачи",
      "Библиотека графов",
      "Мои решения",
      "Конструктор задач",
      "Плагины",
      "Пользователи",
    ]);
  });

  it("treats an unknown role as a regular signed-in user", () => {
    expect(titles("SOMETHING")).toEqual(["Треки", "Задачи", "Библиотека графов", "Мои решения"]);
  });

  it("gives every section its address", () => {
    const sections = visibleSections("ADMIN");
    expect(sections[0]).toEqual({ title: "Треки", to: "/tracks" });
    expect(sections[6]).toEqual({ title: "Пользователи", to: "/users" });
  });
});

describe("isSectionActive", () => {
  it("is active on the section page", () => {
    expect(isSectionActive("/tasks", "/tasks")).toBe(true);
  });

  it("is active on a nested page", () => {
    expect(isSectionActive("/tasks/15", "/tasks")).toBe(true);
  });

  it("is not active on another section", () => {
    expect(isSectionActive("/sandbox", "/tasks")).toBe(false);
  });

  it("does not confuse sections with a common prefix", () => {
    expect(isSectionActive("/tasks-archive", "/tasks")).toBe(false);
  });
});
