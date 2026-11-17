import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOTKEYS,
  findHotkey,
  hotkeyText,
  keyName,
  toolAction,
  toolFromAction,
  withHotkey,
  type Hotkey,
} from "./hotkeys";

function press(code: string, ctrl: boolean, shift: boolean) {
  return { code: code, ctrlKey: ctrl, metaKey: false, shiftKey: shift, altKey: false };
}

function find(code: string, ctrl: boolean, shift: boolean) {
  return findHotkey(press(code, ctrl, shift), DEFAULT_HOTKEYS);
}

describe("editor hotkeys", () => {
  it("switches tools with digits and H", () => {
    expect(find("Digit1", false, false)).toBe("tool-select");
    expect(find("Numpad1", false, false)).toBe("tool-select");
    expect(find("KeyH", false, false)).toBe("tool-pan");
    expect(find("Digit2", false, false)).toBe("tool-vertex");
    expect(find("Digit3", false, false)).toBe("tool-edge");
    expect(find("Digit4", false, false)).toBe("tool-delete");
  });

  it("undoes and redoes with Ctrl", () => {
    expect(find("KeyZ", true, false)).toBe("undo");
    expect(find("KeyZ", true, true)).toBe("redo");
    expect(find("KeyY", true, false)).toBe("redo");
    const withMeta = {
      code: "KeyZ",
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      altKey: false,
    };
    expect(findHotkey(withMeta, DEFAULT_HOTKEYS)).toBe("undo");
    expect(find("KeyZ", false, false)).toBeNull();
  });

  it("zooms with plus, minus, zero and Shift+1", () => {
    expect(find("Equal", false, false)).toBe("zoom-in");
    expect(find("Equal", false, true)).toBe("zoom-in");
    expect(find("NumpadAdd", false, false)).toBe("zoom-in");
    expect(find("Minus", false, false)).toBe("zoom-out");
    expect(find("NumpadSubtract", false, false)).toBe("zoom-out");
    expect(find("Digit0", false, false)).toBe("zoom-reset");
    expect(find("Digit0", false, true)).toBeNull();
    expect(find("Digit1", false, true)).toBe("zoom-fit");
  });

  it("leaves browser zoom with Ctrl alone", () => {
    expect(find("Equal", true, false)).toBeNull();
    expect(find("Minus", true, false)).toBeNull();
    expect(find("Digit0", true, false)).toBeNull();
  });

  it("selects all, deletes and cancels", () => {
    expect(find("KeyA", true, false)).toBe("select-all");
    expect(find("KeyA", false, false)).toBeNull();
    expect(find("Delete", false, false)).toBe("delete");
    expect(find("Backspace", false, false)).toBe("delete");
    expect(find("Escape", false, false)).toBe("cancel");
  });

  it("ignores keys pressed with Alt", () => {
    const withAlt = {
      code: "Digit1",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: true,
    };
    expect(findHotkey(withAlt, DEFAULT_HOTKEYS)).toBeNull();
  });

  it("uses whatever table it gets", () => {
    const custom: Hotkey[] = [{ action: "tool-pan", code: "KeyP", ctrl: false, shift: false }];
    expect(findHotkey(press("KeyP", false, false), custom)).toBe("tool-pan");
    expect(findHotkey(press("KeyH", false, false), custom)).toBeNull();
  });

  it("writes hotkeys for tooltips", () => {
    expect(keyName("Digit1")).toBe("1");
    expect(keyName("KeyH")).toBe("H");
    expect(keyName("Minus")).toBe("−");
    expect(hotkeyText("undo", DEFAULT_HOTKEYS)).toBe("Ctrl+Z");
    expect(hotkeyText("redo", DEFAULT_HOTKEYS)).toBe("Ctrl+Shift+Z");
    expect(hotkeyText("zoom-fit", DEFAULT_HOTKEYS)).toBe("Shift+1");
    expect(withHotkey("Рука", "tool-pan", DEFAULT_HOTKEYS)).toBe("Рука (H)");
    expect(withHotkey("Рука", "tool-pan", [])).toBe("Рука");
  });

  it("links tools and their hotkey actions", () => {
    expect(toolAction("pan")).toBe("tool-pan");
    expect(toolFromAction("tool-edge")).toBe("edge");
    expect(toolFromAction("undo")).toBeNull();
  });
});
