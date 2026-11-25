import { describe, expect, it } from "vitest";
import { addEdge, addVertex } from "@/entities/graph";
import {
  createTaskDraft,
  draftProblems,
  draftReadiness,
  draftTabs,
  graphForRules,
  pluralize,
  studentHints,
  studentRules,
  studentStartGraph,
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
    expect(tabIds(draft)).toEqual(["main", "conditions", "student"]);
    draft.hasGraph = true;
    expect(tabIds(draft)).toEqual(["main", "graph", "conditions", "student"]);
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

  it("picks the right Russian word for a number", () => {
    expect(pluralize(1, "вершина", "вершины", "вершин")).toBe("1 вершина");
    expect(pluralize(3, "вершина", "вершины", "вершин")).toBe("3 вершины");
    expect(pluralize(7, "вершина", "вершины", "вершин")).toBe("7 вершин");
    expect(pluralize(12, "вершина", "вершины", "вершин")).toBe("12 вершин");
    expect(pluralize(21, "вершина", "вершины", "вершин")).toBe("21 вершина");
    expect(pluralize(0, "ребро", "ребра", "рёбер")).toBe("0 рёбер");
  });

  it("shows what is done and what is left", () => {
    const draft = filledDraft();
    draft.hasGraph = true;
    let graph = addVertex(draft.graph, 0, 0);
    graph = addVertex(graph, 100, 0);
    draft.graph = addEdge(graph, graph.vertices[0].id, graph.vertices[1].id);
    expect(draftReadiness(draft)).toEqual([
      { text: "Название", isDone: true },
      { text: "Категория", isDone: true },
      { text: "Описание", isDone: true },
      { text: "Граф: 2 вершины, 1 ребро", isDone: true },
    ]);
    draft.category = "";
    expect(draftReadiness(draft)[1]).toEqual({ text: "Введите категорию", isDone: false });
    expect(draftProblems(draft)).toEqual(["Введите категорию"]);
  });

  it("gives the student the task rules only for a given graph", () => {
    const draft = createTaskDraft();
    draft.rules.canAdd = false;
    draft.rules.direction = "directed";
    expect(studentRules(draft).canAdd).toBe(true);
    expect(studentRules(draft).direction).toBe("directed");
    draft.hasGraph = true;
    expect(studentRules(draft).canAdd).toBe(false);
  });

  it("starts the student with the task graph or an empty one of the right kind", () => {
    const draft = createTaskDraft();
    draft.rules.direction = "directed";
    let start = studentStartGraph(draft);
    expect(start.vertices.length).toBe(0);
    expect(start.isDirected).toBe(true);
    draft.hasGraph = true;
    draft.graph = addVertex(draft.graph, 5, 5);
    start = studentStartGraph(draft);
    expect(start.vertices.length).toBe(1);
    expect(start.isDirected).toBe(true);
  });

  it("explains the limits to the student", () => {
    const draft = createTaskDraft();
    expect(studentHints(draft)).toEqual(["Граф студент рисует сам."]);
    draft.hasGraph = true;
    draft.rules.direction = "undirected";
    draft.rules.canMove = false;
    expect(studentHints(draft)).toEqual([
      "Граф может быть только неориентированным.",
      "В этой задаче нельзя двигать вершины.",
    ]);
  });
});
