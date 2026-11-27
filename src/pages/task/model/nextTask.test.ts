import { describe, expect, it } from "vitest";
import { ATTEMPTS_SHOWN, attemptTitle, pickNextTask, recentAttempts } from "./nextTask";

describe("next task and attempts", () => {
  it("never offers the same task again", () => {
    const items = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
      { id: "3", name: "c" },
    ];
    expect(pickNextTask(items, "1", 0)).toEqual({ id: "2", name: "b" });
    expect(pickNextTask(items, "1", 0.99)).toEqual({ id: "3", name: "c" });
    expect(pickNextTask([{ id: "1", name: "a" }], "1", 0.5)).toBeNull();
  });

  it("shows the newest attempts first", () => {
    const items: { id: string; isCorrect: boolean }[] = [];
    for (let index = 0; index < 12; index++) {
      items.push({ id: String(index), isCorrect: index === 11 });
    }
    const shown = recentAttempts(items);
    expect(shown.length).toBe(ATTEMPTS_SHOWN);
    expect(shown[0].id).toBe("11");
    expect(attemptTitle(0, 12)).toBe("Попытка 12");
    expect(attemptTitle(1, 12)).toBe("Попытка 11");
  });
});
