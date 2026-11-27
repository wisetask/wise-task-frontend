import { describe, expect, it } from "vitest";
import { readinessMood, readinessShare, ringLength, ringOffset } from "./readinessRing";

describe("readiness ring", () => {
  it("counts the done items", () => {
    const share = readinessShare([
      { text: "Название", isDone: true, target: "name" },
      { text: "Введите категорию", isDone: false, target: "category" },
      { text: "Описание", isDone: true, target: "description" },
    ]);
    expect(share).toEqual({ done: 2, total: 3, percent: 67 });
    expect(readinessMood(share)).toBe("Почти готово");
    expect(readinessMood({ done: 0, total: 4, percent: 0 })).toBe("Чистый лист");
    expect(readinessMood({ done: 4, total: 4, percent: 100 })).toBe("Можно создавать");
  });

  it("turns the percent into a stroke offset", () => {
    expect(ringOffset(0, 10)).toBeCloseTo(ringLength(10));
    expect(ringOffset(100, 10)).toBe(0);
    expect(ringOffset(150, 10)).toBe(0);
    expect(ringOffset(50, 10)).toBeCloseTo(ringLength(10) / 2);
  });
});
