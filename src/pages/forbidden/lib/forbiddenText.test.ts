import { describe, expect, it } from "vitest";
import { forbiddenText } from "./forbiddenText";

describe("forbiddenText", () => {
  it("перечисляет роли, которым доступна страница", () => {
    expect(forbiddenText(["AUTHOR", "ADMIN"])).toBe(
      "Эта страница доступна только авторам и администраторам",
    );
    expect(forbiddenText(["ADMIN"])).toBe("Эта страница доступна только администраторам");
  });

  it("без ролей пишет общий текст", () => {
    expect(forbiddenText(undefined)).toBe("У вас нет доступа к этой странице");
    expect(forbiddenText([])).toBe("У вас нет доступа к этой странице");
  });
});
