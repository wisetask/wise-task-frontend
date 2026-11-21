import { describe, expect, it } from "vitest";
import { parseToken } from "./parseToken";

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeToken(payload: unknown): string {
  return `header.${toBase64Url(JSON.stringify(payload))}.signature`;
}

describe("parseToken", () => {
  it("достаёт id, email и exp из нормального токена", () => {
    const token = makeToken({ sub: "42", email: "student@test.ru", iat: 1000, exp: 4600 });

    expect(parseToken(token)).toEqual({ id: "42", email: "student@test.ru", exp: 4600 });
  });

  it("понимает base64url с символами - и _", () => {
    const token = makeToken({ sub: "1", email: "x>>>???@test.ru", exp: 1 });

    expect(token).toContain("-");
    expect(token).toContain("_");
    expect(parseToken(token)).toEqual({ id: "1", email: "x>>>???@test.ru", exp: 1 });
  });

  it("возвращает null для пустой строки", () => {
    expect(parseToken("")).toBeNull();
  });

  it("возвращает null, если в токене нет точек", () => {
    expect(parseToken("not-a-token")).toBeNull();
  });

  it("возвращает null, если данные токена не JSON", () => {
    expect(parseToken(`header.${toBase64Url("not json")}.signature`)).toBeNull();
  });

  it("возвращает null, если не хватает полей", () => {
    expect(parseToken(makeToken({ sub: "42", exp: 4600 }))).toBeNull();
    expect(parseToken(makeToken({ sub: "42", email: "student@test.ru", exp: "4600" }))).toBeNull();
  });
});
