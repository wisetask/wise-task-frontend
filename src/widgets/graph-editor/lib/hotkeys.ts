import type { EditorTool } from "./selection";

export type HotkeyAction =
  | "tool-select"
  | "tool-pan"
  | "tool-vertex"
  | "tool-edge"
  | "tool-delete"
  | "undo"
  | "redo"
  | "zoom-in"
  | "zoom-out"
  | "zoom-reset"
  | "zoom-fit"
  | "select-all"
  | "copy"
  | "cut"
  | "paste"
  | "duplicate"
  | "delete"
  | "cancel";

export interface Hotkey {
  action: HotkeyAction;
  code: string;
  ctrl: boolean;
  shift: boolean;
}

export interface KeyPress {
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

function key(action: HotkeyAction, code: string): Hotkey {
  return { action: action, code: code, ctrl: false, shift: false };
}

function ctrlKey(action: HotkeyAction, code: string): Hotkey {
  return { action: action, code: code, ctrl: true, shift: false };
}

function shiftKey(action: HotkeyAction, code: string): Hotkey {
  return { action: action, code: code, ctrl: false, shift: true };
}

export const DEFAULT_HOTKEYS: Hotkey[] = [
  key("tool-select", "Digit1"),
  key("tool-select", "Numpad1"),
  key("tool-pan", "KeyH"),
  key("tool-vertex", "Digit2"),
  key("tool-vertex", "Numpad2"),
  key("tool-edge", "Digit3"),
  key("tool-edge", "Numpad3"),
  key("tool-delete", "Digit4"),
  key("tool-delete", "Numpad4"),
  ctrlKey("undo", "KeyZ"),
  { action: "redo", code: "KeyZ", ctrl: true, shift: true },
  ctrlKey("redo", "KeyY"),
  key("zoom-in", "Equal"),
  shiftKey("zoom-in", "Equal"),
  key("zoom-in", "NumpadAdd"),
  key("zoom-out", "Minus"),
  shiftKey("zoom-out", "Minus"),
  key("zoom-out", "NumpadSubtract"),
  key("zoom-reset", "Digit0"),
  key("zoom-reset", "Numpad0"),
  shiftKey("zoom-fit", "Digit1"),
  ctrlKey("select-all", "KeyA"),
  ctrlKey("copy", "KeyC"),
  ctrlKey("cut", "KeyX"),
  ctrlKey("paste", "KeyV"),
  ctrlKey("duplicate", "KeyD"),
  key("delete", "Delete"),
  key("delete", "Backspace"),
  key("cancel", "Escape"),
];

export function findHotkey(press: KeyPress, hotkeys: Hotkey[]): HotkeyAction | null {
  if (press.altKey) {
    return null;
  }
  const ctrl = press.ctrlKey || press.metaKey;
  for (const hotkey of hotkeys) {
    if (hotkey.code === press.code && hotkey.ctrl === ctrl && hotkey.shift === press.shiftKey) {
      return hotkey.action;
    }
  }
  return null;
}

const KEY_NAMES: Record<string, string> = {
  Equal: "+",
  Minus: "−",
  NumpadAdd: "+",
  NumpadSubtract: "−",
  Escape: "Esc",
  Delete: "Delete",
  Backspace: "Backspace",
};

export function keyName(code: string): string {
  if (KEY_NAMES[code] !== undefined) {
    return KEY_NAMES[code];
  }
  if (code.startsWith("Digit")) {
    return code.slice(5);
  }
  if (code.startsWith("Numpad")) {
    return code.slice(6);
  }
  if (code.startsWith("Key")) {
    return code.slice(3);
  }
  return code;
}

export function hotkeyText(action: HotkeyAction, hotkeys: Hotkey[]): string {
  for (const hotkey of hotkeys) {
    if (hotkey.action === action) {
      let text = keyName(hotkey.code);
      if (hotkey.shift) {
        text = "Shift+" + text;
      }
      if (hotkey.ctrl) {
        text = "Ctrl+" + text;
      }
      return text;
    }
  }
  return "";
}

export function withHotkey(title: string, action: HotkeyAction, hotkeys: Hotkey[]): string {
  const text = hotkeyText(action, hotkeys);
  if (text === "") {
    return title;
  }
  return title + " (" + text + ")";
}

const TOOL_ACTIONS: Record<EditorTool, HotkeyAction> = {
  select: "tool-select",
  pan: "tool-pan",
  vertex: "tool-vertex",
  edge: "tool-edge",
  delete: "tool-delete",
};

const TOOLS: EditorTool[] = ["select", "pan", "vertex", "edge", "delete"];

export function toolAction(tool: EditorTool): HotkeyAction {
  return TOOL_ACTIONS[tool];
}

export function toolFromAction(action: HotkeyAction): EditorTool | null {
  for (const tool of TOOLS) {
    if (TOOL_ACTIONS[tool] === action) {
      return tool;
    }
  }
  return null;
}
