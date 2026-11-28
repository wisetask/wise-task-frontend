import { describe, expect, it } from "vitest";
import { roleAbilities, roleHint } from "./roleAbilities";

function availableCount(role: string): number {
  return roleAbilities(role).filter((ability) => ability.available).length;
}

describe("roleAbilities", () => {
  it("gives each next role more abilities", () => {
    expect(availableCount("USER")).toBe(2);
    expect(availableCount("AUTHOR")).toBe(3);
    expect(availableCount("ADMIN")).toBe(4);
  });

  it("says who can do what the role cannot", () => {
    const constructor = roleAbilities("USER")[2];
    expect(constructor.available).toBe(false);
    expect(constructor.whoCan).toBe("авторам");
  });

  it("treats an unknown role as having nothing extra", () => {
    expect(availableCount("GUEST")).toBe(0);
  });
});

describe("roleHint", () => {
  it("tells a student where to ask for the constructor", () => {
    expect(roleHint("USER")).toContain("преподавателю");
  });

  it("has nothing to suggest to an admin", () => {
    expect(roleHint("ADMIN")).toBe("");
  });
});
