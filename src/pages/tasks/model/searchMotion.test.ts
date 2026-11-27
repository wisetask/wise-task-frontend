import { describe, expect, it } from "vitest";
import {
  chainLinks,
  codeMatches,
  countStep,
  GRAPH_CODE,
  PLACEHOLDER_HOLD,
  placeholderExamples,
  placeholderFrame,
  popoverPlace,
  pushCode,
  TILT_MAX,
  tiltAngles,
  wantsKonigsberg,
} from "./searchMotion";
import type { TaskListItem } from "./taskList";

function task(name: string): TaskListItem {
  return {
    id: name,
    name: name,
    category: "",
    description: "",
    fullDescription: "",
    author: "",
    isPublic: true,
  };
}

describe("search motion", () => {
  it("counts from the old number to the new one", () => {
    expect(countStep(0, 100, 0)).toBe(0);
    expect(countStep(0, 100, 1)).toBe(100);
    expect(countStep(0, 100, 2)).toBe(100);
    expect(countStep(200, 100, 1)).toBe(100);
    expect(countStep(0, 100, 0.5)).toBeGreaterThan(50);
  });

  it("takes short unique task names as examples", () => {
    const tasks = [
      task("Степень вершины"),
      task("степень вершины"),
      task("Граф"),
      task("Очень длинное название задачи про графы и деревья"),
      task("Дерево"),
    ];
    expect(placeholderExamples(tasks, 5)).toEqual([
      "например, Степень вершины",
      "например, Граф",
      "например, Дерево",
    ]);
    expect(placeholderExamples(tasks, 1)).toEqual(["например, Степень вершины"]);
  });

  it("types, holds and erases each phrase in turn", () => {
    const phrases = ["абв", "где"];
    expect(placeholderFrame(phrases, 0)).toBe("а");
    expect(placeholderFrame(phrases, 2)).toBe("абв");
    expect(placeholderFrame(phrases, 2 + PLACEHOLDER_HOLD)).toBe("абв");
    expect(placeholderFrame(phrases, 3 + PLACEHOLDER_HOLD)).toBe("а");
    expect(placeholderFrame(phrases, 4 + PLACEHOLDER_HOLD)).toBe("");
    expect(placeholderFrame(phrases, 5 + PLACEHOLDER_HOLD)).toBe("г");
    expect(placeholderFrame([], 3)).toBe("");
  });

  it("notices the secret word typed on any layout", () => {
    let buffer: string[] = [];
    for (const code of ["KeyX", "KeyU", "KeyH", "KeyF", "KeyA"]) {
      buffer = pushCode(buffer, code, GRAPH_CODE);
    }
    expect(buffer.length).toBe(GRAPH_CODE.length);
    expect(codeMatches(buffer, GRAPH_CODE)).toBe(true);
    expect(codeMatches(pushCode(buffer, "KeyB", GRAPH_CODE), GRAPH_CODE)).toBe(false);
  });

  it("tilts the card towards the cursor", () => {
    expect(tiltAngles(50, 50, 100, 100)).toEqual({ x: 0, y: 0 });
    expect(tiltAngles(100, 0, 100, 100)).toEqual({ x: TILT_MAX, y: TILT_MAX });
    expect(tiltAngles(0, 100, 100, 100)).toEqual({ x: -TILT_MAX, y: -TILT_MAX });
    expect(tiltAngles(10, 10, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it("links the cards into a chain with a few chords", () => {
    expect(chainLinks(1)).toEqual([]);
    expect(chainLinks(4)).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
    ]);
  });

  it("shows the bridges of Königsberg only when asked", () => {
    expect(wantsKonigsberg("Мосты Кёнигсберга", 5)).toBe(true);
    expect(wantsKonigsberg("эйлеров цикл", 0)).toBe(true);
    expect(wantsKonigsberg("эйлеров цикл", 3)).toBe(false);
    expect(wantsKonigsberg("дерево", 0)).toBe(false);
    expect(wantsKonigsberg("", 0)).toBe(false);
  });

  it("puts the preview beside the card where there is room", () => {
    const card = { left: 400, right: 1300, top: 300 };
    expect(popoverPlace(card, 1800, 900, 340, 380)).toEqual({ left: 1314, top: 300 });
    expect(popoverPlace(card, 1400, 900, 340, 380)).toEqual({ left: 46, top: 300 });
    expect(popoverPlace({ left: 10, right: 990, top: 300 }, 1000, 900, 340, 380)).toBeNull();
    expect(popoverPlace({ left: 400, right: 1300, top: 800 }, 1800, 900, 340, 380)).toEqual({
      left: 1314,
      top: 506,
    });
  });
});
