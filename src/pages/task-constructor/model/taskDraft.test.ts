import { describe, expect, it } from "vitest";
import { addVertex } from "@/entities/graph";
import {
  createTaskDraft,
  draftProblems,
  draftTabs,
  graphForRules,
  type TaskDraft,
} from "./taskDraft";

function filledDraft(): TaskDraft {
  const draft = createTaskDraft();
  draft.name = "Дерево";
  draft.category = "Деревья";
  draft.description = "Нарисуйте дерево с 6 вершинами";
  return draft;
}

function tabIds(draft: TaskDraft): string[] {
  const ids: string[] = [];
  for (const tab of draftTabs(draft)) {
    ids.push(tab.id);
  }
  return ids;
}

describe("task draft", () => {
  it("starts empty, without a given graph and with everything allowed", () => {
    const draft = createTaskDraft();
    expect(draft.name).toBe("");
    expect(draft.hasGraph).toBe(false);
    expect(draft.graph.vertices.length).toBe(0);
    expect(draft.rules.canAdd).toBe(true);
    expect(draft.rules.direction).toBe("any");
  });

  it("shows the graph tab only when the graph is given", () => {
    const draft = createTaskDraft();
    expect(tabIds(draft)).toEqual(["main", "conditions"]);
    draft.hasGraph = true;
    expect(tabIds(draft)).toEqual(["main", "graph", "conditions"]);
  });

  it("lists what is missing before the task can be saved", () => {
    expect(draftProblems(createTaskDraft()).length).toBe(3);
    const draft = filledDraft();
    expect(draftProblems(draft)).toEqual([]);
    draft.name = "   ";
    expect(draftProblems(draft)).toEqual(["Введите название задачи"]);
  });

  it("asks for a graph when the graph is given but empty", () => {
    const draft = filledDraft();
    draft.hasGraph = true;
    expect(draftProblems(draft).length).toBe(1);
    draft.graph = addVertex(draft.graph, 0, 0);
    expect(draftProblems(draft)).toEqual([]);
  });

  it("turns the graph into the kind the task asks for", () => {
    const draft = createTaskDraft();
    const graph = draft.graph;
    expect(graphForRules(graph, draft.rules)).toBe(graph);
    draft.rules.direction = "directed";
    expect(graphForRules(graph, draft.rules).isDirected).toBe(true);
    draft.rules.direction = "undirected";
    expect(graphForRules(graph, draft.rules)).toBe(graph);
  });
});
