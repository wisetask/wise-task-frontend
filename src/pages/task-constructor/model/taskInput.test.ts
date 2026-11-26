import { describe, expect, it } from "vitest";
import { addVertex } from "@/entities/graph";
import { allowEverything } from "@/widgets/graph-editor";
import { createTaskDraft, type TaskDraft } from "./taskDraft";
import {
  directionFromInput,
  graphTypeInput,
  ruleInput,
  rulesFromInput,
  toTaskGraphInput,
} from "./taskInput";

function coloringDraft(): TaskDraft {
  const draft = createTaskDraft();
  draft.name = "  Правильная раскраска ";
  draft.category = "Раскраска графов";
  draft.description = "Раскрасьте вершины";
  draft.hasGraph = true;
  draft.graph = addVertex(draft.graph, 10, 20);
  draft.rules = {
    canAdd: false,
    canDelete: false,
    canEditLabels: false,
    canColor: true,
    canMove: false,
    direction: "directed",
  };
  return draft;
}

describe("task for the backend", () => {
  it("names the graph kind the way the backend does", () => {
    expect(graphTypeInput("directed")).toBe("DIRECT");
    expect(graphTypeInput("undirected")).toBe("UNDIRECT");
    expect(graphTypeInput("any")).toBe("ANY");
    expect(directionFromInput("DIRECT")).toBe("directed");
    expect(directionFromInput(null)).toBe("any");
  });

  it("allows editing only when both adding and labels are allowed", () => {
    const rules = allowEverything();
    expect(ruleInput(rules)).toEqual({ isColor: true, isEdit: true, isMove: true, isDelete: true });
    rules.canEditLabels = false;
    expect(ruleInput(rules).isEdit).toBe(false);
  });

  it("turns backend rules back into editor rules", () => {
    const rule = { isColor: true, isEdit: false, isMove: true, isDelete: false };
    const rules = rulesFromInput(rule, "UNDIRECT");
    expect(rules.canAdd).toBe(false);
    expect(rules.canEditLabels).toBe(false);
    expect(rules.canMove).toBe(true);
    expect(rules.direction).toBe("undirected");
  });

  it("sends the given graph with its rules and kind", () => {
    const input = toTaskGraphInput(coloringDraft());
    expect(input.name).toBe("Правильная раскраска");
    expect(input.taskType).toBe("GRAPH");
    expect(input.graphType).toBe("DIRECT");
    expect(input.rule).toEqual({ isColor: true, isEdit: false, isMove: false, isDelete: false });
    expect(input.graph).not.toBeNull();
    if (input.graph !== null) {
      expect(input.graph.vertexCount).toBe(1);
      expect(input.graph.isDirect).toBe(true);
    }
    expect(input.condition).toEqual([]);
    expect(input.isHiddenMistake).toBe(false);
  });

  it("sends no graph and allows everything when the student draws the graph", () => {
    const draft = coloringDraft();
    draft.hasGraph = false;
    const input = toTaskGraphInput(draft);
    expect(input.graph).toBeNull();
    expect(input.rule).toEqual({ isColor: true, isEdit: true, isMove: true, isDelete: true });
    expect(input.graphType).toBe("DIRECT");
  });
});
