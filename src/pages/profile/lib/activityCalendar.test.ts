import { describe, expect, it } from "vitest";
import {
  activityLevel,
  buildCalendar,
  cellTitle,
  dateKey,
  solutionsWord,
} from "./activityCalendar";

const TODAY = new Date(2026, 10, 28);

describe("buildCalendar", () => {
  it("covers 53 weeks of 7 days, ending today", () => {
    const calendar = buildCalendar(TODAY, []);
    expect(calendar.weeks.length).toBe(53);
    for (const week of calendar.weeks) {
      expect(week.length).toBe(7);
    }

    const lastWeek = calendar.weeks[52];
    expect(lastWeek[5]?.date).toBe("2026-11-28");
    expect(lastWeek[6]).toBeNull();
  });

  it("starts every week on Monday", () => {
    const calendar = buildCalendar(TODAY, []);
    const firstDay = calendar.weeks[0][0];
    expect(firstDay).not.toBeNull();
    if (firstDay !== null) {
      const parts = firstDay.date.split("-");
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      expect(date.getDay()).toBe(1);
    }
  });

  it("places counts on their days and sums them", () => {
    const calendar = buildCalendar(TODAY, [
      { date: "2026-11-28", count: 4 },
      { date: "2026-11-27", count: 1 },
      { date: "2025-01-01", count: 9 },
    ]);
    expect(calendar.weeks[52][5]?.count).toBe(4);
    expect(calendar.weeks[52][4]?.count).toBe(1);
    expect(calendar.total).toBe(5);
  });

  it("labels each month once", () => {
    const labels = buildCalendar(TODAY, []).months.map((month) => month.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain("ноя");
  });
});

describe("links between active days", () => {
  it("joins neighbouring active days and leaves empty days alone", () => {
    const calendar = buildCalendar(TODAY, [
      { date: "2026-11-16", count: 1 },
      { date: "2026-11-23", count: 2 },
      { date: "2026-11-24", count: 1 },
    ]);
    const previousMonday = calendar.weeks[51][0];
    const monday = calendar.weeks[52][0];
    const tuesday = calendar.weeks[52][1];
    expect(previousMonday?.linkRight).toBe(true);
    expect(monday?.linkDown).toBe(true);
    expect(tuesday?.linkDown).toBe(false);
    expect(calendar.weeks[52][2]?.linkDown).toBe(false);
  });
});

describe("activityLevel", () => {
  it("splits activity into four shades", () => {
    expect(activityLevel(0, 8)).toBe(0);
    expect(activityLevel(1, 8)).toBe(1);
    expect(activityLevel(4, 8)).toBe(2);
    expect(activityLevel(8, 8)).toBe(4);
  });
});

describe("texts", () => {
  it("declines the word «решение»", () => {
    expect(solutionsWord(1)).toBe("решение");
    expect(solutionsWord(3)).toBe("решения");
    expect(solutionsWord(12)).toBe("решений");
    expect(solutionsWord(21)).toBe("решение");
  });

  it("titles a cell", () => {
    expect(
      cellTitle({ date: "2026-03-12", count: 3, level: 2, linkDown: false, linkRight: false }),
    ).toBe("3 решения · четверг, 12 марта");
    expect(
      cellTitle({ date: "2026-03-12", count: 0, level: 0, linkDown: false, linkRight: false }),
    ).toBe("Нет решений · четверг, 12 марта");
  });

  it("formats a date key", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
