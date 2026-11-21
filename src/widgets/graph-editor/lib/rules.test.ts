import { describe, expect, it } from "vitest";
import {
  allowEverything,
  canRunHotkey,
  canRunMenuAction,
  canUseTool,
  directedByRules,
  rulesSummary,
  withDirection,
  withFlag,
  type EditorRules,
} from "./rules";

function onlyMoveAndColor(): EditorRules {
  return {
    canAdd: false,
    canDelete: false,
    canEditLabels: false,
    canColor: true,
    canMove: true,
    direction: "directed",
  };
}

describe("editor rules", () => {
  it("allows every tool and action by default", () => {
    const rules = allowEverything();
    expect(canUseTool("vertex", rules)).toBe(true);
    expect(canUseTool("delete", rules)).toBe(true);
    expect(canRunHotkey("paste", rules)).toBe(true);
    expect(canRunMenuAction("layout-grid", rules)).toBe(true);
    expect(rulesSummary(rules)).toBe("");
  });

  it("hides adding and deleting tools when they are forbidden", () => {
    const rules = onlyMoveAndColor();
    expect(canUseTool("select", rules)).toBe(true);
    expect(canUseTool("pan", rules)).toBe(true);
    expect(canUseTool("vertex", rules)).toBe(false);
    expect(canUseTool("edge", rules)).toBe(false);
    expect(canUseTool("delete", rules)).toBe(false);
  });

  it("blocks hotkeys that would break the rules", () => {
    const rules = onlyMoveAndColor();
    expect(canRunHotkey("tool-vertex", rules)).toBe(false);
    expect(canRunHotkey("tool-select", rules)).toBe(true);
    expect(canRunHotkey("delete", rules)).toBe(false);
    expect(canRunHotkey("cut", rules)).toBe(false);
    expect(canRunHotkey("copy", rules)).toBe(true);
    expect(canRunHotkey("paste", rules)).toBe(false);
    expect(canRunHotkey("duplicate", rules)).toBe(false);
    expect(canRunHotkey("rename", rules)).toBe(false);
    expect(canRunHotkey("move-left-far", rules)).toBe(true);
    expect(canRunHotkey("undo", rules)).toBe(true);
    rules.canMove = false;
    expect(canRunHotkey("move-up", rules)).toBe(false);
  });

  it("filters context menu actions", () => {
    const rules = onlyMoveAndColor();
    expect(canRunMenuAction("add-vertex", rules)).toBe(false);
    expect(canRunMenuAction("add-loop", rules)).toBe(false);
    expect(canRunMenuAction("delete", rules)).toBe(false);
    expect(canRunMenuAction("layout", rules)).toBe(true);
    expect(canRunMenuAction("fit-view", rules)).toBe(true);
    rules.canMove = false;
    expect(canRunMenuAction("layout-circle", rules)).toBe(false);
  });

  it("tells whether the direction is fixed", () => {
    const rules = allowEverything();
    expect(directedByRules(rules)).toBeNull();
    rules.direction = "directed";
    expect(directedByRules(rules)).toBe(true);
    rules.direction = "undirected";
    expect(directedByRules(rules)).toBe(false);
  });

  it("explains what is forbidden", () => {
    expect(rulesSummary(onlyMoveAndColor())).toBe(
      "В этой задаче нельзя добавлять вершины и рёбра, удалять, менять подписи и веса.",
    );
  });

  it("changes one rule in a copy", () => {
    const rules = allowEverything();
    const noColor = withFlag(rules, "canColor", false);
    expect(noColor.canColor).toBe(false);
    expect(noColor.canMove).toBe(true);
    expect(rules.canColor).toBe(true);
    const directed = withDirection(noColor, "directed");
    expect(directed.direction).toBe("directed");
    expect(directed.canColor).toBe(false);
    expect(noColor.direction).toBe("any");
  });
});
