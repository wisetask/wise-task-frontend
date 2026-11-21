import { describe, expect, it } from "vitest";
import { getRedirectPath } from "./getRedirectPath";

describe("getRedirectPath", () => {
  it("возвращает адрес внутри сайта", () => {
    expect(getRedirectPath("/constructor")).toBe("/constructor");
    expect(getRedirectPath("/tasks?page=2")).toBe("/tasks?page=2");
  });

  it("без адреса ведёт на главную", () => {
    expect(getRedirectPath(undefined)).toBe("/");
    expect(getRedirectPath(null)).toBe("/");
    expect(getRedirectPath("")).toBe("/");
  });

  it("не пускает на чужие сайты", () => {
    expect(getRedirectPath("https://evil.com")).toBe("/");
    expect(getRedirectPath("//evil.com")).toBe("/");
  });

  it("не принимает несколько значений", () => {
    expect(getRedirectPath(["/a", "/b"])).toBe("/");
  });
});
