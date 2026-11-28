import { describe, expect, it } from "vitest";
import type { Role } from "@/shared/api";
import type { User } from "../model/types";
import { checkAccess } from "./checkAccess";

function makeUser(role: Role): User {
  return {
    id: "1",
    email: "user@test.ru",
    role,
    firstName: "Анна",
    lastName: "Иванова",
    patronymic: null,
  };
}

const authorsOnly = { roles: ["AUTHOR", "ADMIN"] } as const;

describe("checkAccess", () => {
  it("пускает на страницу без пометок всех", () => {
    expect(checkAccess(null, {})).toBe("allow");
    expect(checkAccess(makeUser("USER"), {})).toBe("allow");
  });

  it("отправляет на вход, если нужен вход, а его нет", () => {
    expect(checkAccess(null, { requiresAuth: true })).toBe("sign-in");
  });

  it("пускает вошедшего на страницу, где нужен только вход", () => {
    expect(checkAccess(makeUser("USER"), { requiresAuth: true })).toBe("allow");
  });

  it("отправляет на вход, если указаны роли, а пользователь не вошёл", () => {
    expect(checkAccess(null, authorsOnly)).toBe("sign-in");
  });

  it("пускает, если роль подходит", () => {
    expect(checkAccess(makeUser("AUTHOR"), authorsOnly)).toBe("allow");
    expect(checkAccess(makeUser("ADMIN"), authorsOnly)).toBe("allow");
  });

  it("не пускает, если роль не подходит", () => {
    expect(checkAccess(makeUser("USER"), authorsOnly)).toBe("forbidden");
  });
});
