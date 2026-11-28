import { describe, expect, it } from "vitest";
import { fullName, roleTitle, userInitials } from "./userLabels";

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

describe("fullName", () => {
  it("joins last name, first name and patronymic", () => {
    expect(fullName("Петров", "Иван", "Сергеевич")).toBe("Петров Иван Сергеевич");
  });

  it("skips an empty or missing patronymic", () => {
    expect(fullName("Петров", "Иван", null)).toBe("Петров Иван");
    expect(fullName("Петров", "Иван", "  ")).toBe("Петров Иван");
  });
});
