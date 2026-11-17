import { describe, expect, it } from "vitest";
import { isSectionActive, roleTitle, userInitials, visibleSections } from "./sections";

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

  it("adds «Конструктор» for an author", () => {
    expect(titles("AUTHOR")).toEqual([
      "Треки",
      "Задачи",
      "Библиотека графов",
      "Мои решения",
      "Конструктор",
    ]);
  });

  it("shows everything to an admin", () => {
    expect(titles("ADMIN")).toEqual([
      "Треки",
      "Задачи",
      "Библиотека графов",
      "Мои решения",
      "Конструктор",
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

describe("roleTitle", () => {
  it("translates known roles", () => {
    expect(roleTitle("USER")).toBe("Студент");
    expect(roleTitle("AUTHOR")).toBe("Автор");
    expect(roleTitle("ADMIN")).toBe("Администратор");
  });

  it("returns an unknown role as is", () => {
    expect(roleTitle("MODERATOR")).toBe("MODERATOR");
  });
});

describe("userInitials", () => {
  it("takes the last name first, then the first name", () => {
    expect(userInitials("Иван", "Петров", "test@test.ru")).toBe("ПИ");
  });

  it("makes letters uppercase", () => {
    expect(userInitials("иван", "петров", "")).toBe("ПИ");
  });

  it("works with only a first name", () => {
    expect(userInitials("Иван", "", "test@test.ru")).toBe("И");
  });

  it("works with only a last name", () => {
    expect(userInitials("", "Петров", "test@test.ru")).toBe("П");
  });

  it("falls back to the email when there is no name", () => {
    expect(userInitials("", "", "test@test.ru")).toBe("T");
  });

  it("ignores spaces around names", () => {
    expect(userInitials("  ", " ", "a@b.ru")).toBe("A");
  });

  it("returns «?» when nothing is known", () => {
    expect(userInitials("", "", "")).toBe("?");
  });
});
