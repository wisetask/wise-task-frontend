import { describe, expect, it } from "vitest";
import { actionKeys, hotkeyHelp, MOUSE_HELP, type HelpSection } from "./hotkeyHelp";
import { DEFAULT_HOTKEYS, type Hotkey } from "./hotkeys";

function rowKeys(sections: HelpSection[], title: string): string[] {
  for (const section of sections) {
    for (const row of section.rows) {
      if (row.title === title) {
        return row.keys;
      }
    }
  }
  return [];
}

describe("hotkey help", () => {
  it("lists every key of an action once", () => {
    expect(actionKeys("tool-select", DEFAULT_HOTKEYS)).toEqual(["1"]);
    expect(actionKeys("delete", DEFAULT_HOTKEYS)).toEqual(["Delete", "Backspace"]);
    expect(actionKeys("redo", DEFAULT_HOTKEYS)).toEqual(["Ctrl+Shift+Z", "Ctrl+Y"]);
  });

  it("hides Shift twins that exist only for other keyboard layouts", () => {
    expect(actionKeys("zoom-in", DEFAULT_HOTKEYS)).toEqual(["+"]);
    expect(actionKeys("zoom-out", DEFAULT_HOTKEYS)).toEqual(["−"]);
    expect(actionKeys("zoom-fit", DEFAULT_HOTKEYS)).toEqual(["Shift+1"]);
  });

  it("builds sections from the hotkey table", () => {
    const sections = hotkeyHelp(DEFAULT_HOTKEYS);
    expect(sections.map((section) => section.title)).toEqual([
      "Инструменты",
      "Правка",
      "Вид",
      "Мышь и тачпад",
    ]);
    expect(rowKeys(sections, "Рука — двигать холст")).toEqual(["H"]);
    expect(rowKeys(sections, "Сдвинуть выделенные вершины")).toEqual(["↑", "↓", "←", "→"]);
    expect(rowKeys(sections, "Горячие клавиши")).toEqual(["?"]);
    expect(rowKeys(sections, "Переименовать вершину или ребро")).toEqual(["F2"]);
  });

  it("follows a custom table and drops rows without keys", () => {
    const custom: Hotkey[] = [{ action: "undo", code: "KeyU", ctrl: false, shift: false }];
    const sections = hotkeyHelp(custom);
    expect(sections.length).toBe(2);
    expect(sections[0].rows).toEqual([{ title: "Отменить", keys: ["U"] }]);
    expect(sections[1]).toBe(MOUSE_HELP);
  });
});
