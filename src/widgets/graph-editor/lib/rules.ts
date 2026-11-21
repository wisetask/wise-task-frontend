import type { MenuAction } from "./contextMenu";
import { toolFromAction, type HotkeyAction } from "./hotkeys";
import type { EditorTool } from "./selection";

export type GraphDirection = "directed" | "undirected" | "any";

export interface EditorRules {
  canAdd: boolean;
  canDelete: boolean;
  canEditLabels: boolean;
  canColor: boolean;
  canMove: boolean;
  direction: GraphDirection;
}

export type RuleFlag = "canAdd" | "canDelete" | "canEditLabels" | "canColor" | "canMove";

export interface RuleFlagOption {
  flag: RuleFlag;
  title: string;
}

export const RULE_FLAGS: RuleFlagOption[] = [
  { flag: "canAdd", title: "Добавлять вершины и рёбра" },
  { flag: "canDelete", title: "Удалять" },
  { flag: "canEditLabels", title: "Менять подписи и веса" },
  { flag: "canColor", title: "Красить" },
  { flag: "canMove", title: "Двигать вершины" },
];

export const DIRECTIONS: GraphDirection[] = ["any", "directed", "undirected"];

export const DIRECTION_TITLES: Record<GraphDirection, string> = {
  any: "Любой",
  directed: "Ориентированный",
  undirected: "Неориентированный",
};

export function allowEverything(): EditorRules {
  return {
    canAdd: true,
    canDelete: true,
    canEditLabels: true,
    canColor: true,
    canMove: true,
    direction: "any",
  };
}

export function copyRules(rules: EditorRules): EditorRules {
  return {
    canAdd: rules.canAdd,
    canDelete: rules.canDelete,
    canEditLabels: rules.canEditLabels,
    canColor: rules.canColor,
    canMove: rules.canMove,
    direction: rules.direction,
  };
}

export function withFlag(rules: EditorRules, flag: RuleFlag, value: boolean): EditorRules {
  const copy = copyRules(rules);
  copy[flag] = value;
  return copy;
}

export function withDirection(rules: EditorRules, direction: GraphDirection): EditorRules {
  const copy = copyRules(rules);
  copy.direction = direction;
  return copy;
}

export function canUseTool(tool: EditorTool, rules: EditorRules): boolean {
  if (tool === "vertex" || tool === "edge") {
    return rules.canAdd;
  }
  if (tool === "delete") {
    return rules.canDelete;
  }
  return true;
}

export function canRunHotkey(action: HotkeyAction, rules: EditorRules): boolean {
  const tool = toolFromAction(action);
  if (tool !== null) {
    return canUseTool(tool, rules);
  }
  if (action === "delete" || action === "cut") {
    return rules.canDelete;
  }
  if (action === "paste" || action === "duplicate") {
    return rules.canAdd;
  }
  if (action === "rename") {
    return rules.canEditLabels;
  }
  if (action.startsWith("move-")) {
    return rules.canMove;
  }
  return true;
}

export function canRunMenuAction(action: MenuAction, rules: EditorRules): boolean {
  if (action === "add-vertex" || action === "add-loop") {
    return rules.canAdd;
  }
  if (action === "delete") {
    return rules.canDelete;
  }
  if (action.startsWith("layout")) {
    return rules.canMove;
  }
  return true;
}

export function directedByRules(rules: EditorRules): boolean | null {
  if (rules.direction === "directed") {
    return true;
  }
  if (rules.direction === "undirected") {
    return false;
  }
  return null;
}

export function rulesSummary(rules: EditorRules): string {
  const forbidden: string[] = [];
  if (!rules.canAdd) {
    forbidden.push("добавлять вершины и рёбра");
  }
  if (!rules.canDelete) {
    forbidden.push("удалять");
  }
  if (!rules.canEditLabels) {
    forbidden.push("менять подписи и веса");
  }
  if (!rules.canColor) {
    forbidden.push("красить");
  }
  if (!rules.canMove) {
    forbidden.push("двигать вершины");
  }
  if (forbidden.length === 0) {
    return "";
  }
  return "В этой задаче нельзя " + forbidden.join(", ") + ".";
}
