import type { Point } from "./geometry";
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
  | "cancel"
  | "move-up"
  | "move-down"
  | "move-left"
  | "move-right"
  | "move-up-far"
  | "move-down-far"
  | "move-left-far"
  | "move-right-far"
  | "rename"
  | "help";

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
  key("move-up", "ArrowUp"),
  key("move-down", "ArrowDown"),
  key("move-left", "ArrowLeft"),
  key("move-right", "ArrowRight"),
  shiftKey("move-up-far", "ArrowUp"),
  shiftKey("move-down-far", "ArrowDown"),
  shiftKey("move-left-far", "ArrowLeft"),
  shiftKey("move-right-far", "ArrowRight"),
  key("rename", "F2"),
  shiftKey("help", "Slash"),
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
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Slash: "/",
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

export function comboText(hotkey: Hotkey): string {
  if (hotkey.code === "Slash" && hotkey.shift && !hotkey.ctrl) {
    return "?";
  }
  let text = keyName(hotkey.code);
  if (hotkey.shift) {
    text = "Shift+" + text;
  }
  if (hotkey.ctrl) {
    text = "Ctrl+" + text;
  }
  return text;
}

export function hotkeyText(action: HotkeyAction, hotkeys: Hotkey[]): string {
  for (const hotkey of hotkeys) {
    if (hotkey.action === action) {
      return comboText(hotkey);
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

export const MOVE_STEP = 1;
export const MOVE_FAR_STEP = 10;

interface MoveAction {
  action: HotkeyAction;
  dx: number;
  dy: number;
}

const MOVES: MoveAction[] = [
  { action: "move-up", dx: 0, dy: -MOVE_STEP },
  { action: "move-down", dx: 0, dy: MOVE_STEP },
  { action: "move-left", dx: -MOVE_STEP, dy: 0 },
  { action: "move-right", dx: MOVE_STEP, dy: 0 },
  { action: "move-up-far", dx: 0, dy: -MOVE_FAR_STEP },
  { action: "move-down-far", dx: 0, dy: MOVE_FAR_STEP },
  { action: "move-left-far", dx: -MOVE_FAR_STEP, dy: 0 },
  { action: "move-right-far", dx: MOVE_FAR_STEP, dy: 0 },
];

export function moveFromAction(action: HotkeyAction): Point | null {
  for (const move of MOVES) {
    if (move.action === action) {
      return { x: move.dx, y: move.dy };
    }
  }
  return null;
}
