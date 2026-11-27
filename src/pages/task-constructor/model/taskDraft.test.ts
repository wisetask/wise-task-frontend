import { describe, expect, it } from "vitest";
import { addEdge, addVertex } from "@/entities/graph";
import {
  answerStartsFromTask,
  canPickAnswerDirection,
  createTaskDraft,
  draftProblems,
  draftReadiness,
  draftTabs,
  draftTitle,
  graphForRules,
  pluralize,
  studentHints,
  studentRules,
  studentStartGraph,
  studentView,
  tabIsDone,
  targetTab,
  taskGraph,
  type TaskDraft,
} from "./taskDraft";

function filledDraft(): TaskDraft {
  const draft = createTaskDraft();
  draft.name = "Дерево";
  draft.category = "Деревья";
  draft.description = "Нарисуйте дерево с 6 вершинами";
  draft.conditions.push({
    id: "condition-1",
    pluginId: "vertices",
    pluginName: "Число вершин",
    pluginType: "GRAPH_CHARACTERISTIC",
    sign: "=",
    value: "6",
    mistakeText: "Нужно шесть вершин",
  });
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
    expect(draft.conditions).toEqual([]);
  });

  it("shows the graph tab only when the graph is given", () => {
    const draft = createTaskDraft();
    expect(tabIds(draft)).toEqual(["main", "conditions", "student"]);
    draft.hasGraph = true;
    expect(tabIds(draft)).toEqual(["main", "graph", "conditions", "student"]);
  });

  it("lists what is missing before the task can be saved", () => {
    expect(draftProblems(createTaskDraft()).length).toBe(4);
    const draft = filledDraft();
    expect(draftProblems(draft)).toEqual([]);
    draft.name = "   ";
    expect(draftProblems(draft)).toEqual(["Введите название задачи"]);
  });

  it("requires at least one valid check and reports the position of an invalid check", () => {
    const draft = filledDraft();
    expect(draftReadiness(draft)).toContainEqual({
      text: "Проверки: 1",
      isDone: true,
      target: "conditions",
    });
    draft.conditions.push({
      id: "condition-2",
      pluginId: "connected",
      pluginName: "Граф связный",
      pluginType: "GRAPH_PROPERTY",
      sign: "",
      value: "Выполняется",
      mistakeText: "",
    });
    expect(draftProblems(draft)).toEqual(["Исправьте проверку 2"]);
    draft.conditions = [];
    expect(draftProblems(draft)).toEqual(["Добавьте хотя бы одну проверку на вкладке «Условия»"]);
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
      { text: "Название", isDone: true, target: "name" },
      { text: "Категория", isDone: true, target: "category" },
      { text: "Описание", isDone: true, target: "description" },
      { text: "Граф: 2 вершины, 1 ребро", isDone: true, target: "graph" },
      { text: "Проверки: 1", isDone: true, target: "conditions" },
    ]);
    draft.category = "";
    expect(draftReadiness(draft)[1]).toEqual({
      text: "Введите категорию",
      isDone: false,
      target: "category",
    });
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

  it("starts the answer from a copy of the task graph", () => {
    const draft = createTaskDraft();
    draft.rules.direction = "directed";
    let start = studentStartGraph(draft);
    expect(start.vertices.length).toBe(0);
    expect(start.isDirected).toBe(true);
    draft.hasGraph = true;
    draft.graph = addVertex(draft.graph, 5, 5);
    expect(answerStartsFromTask(draft)).toBe(true);
    start = studentStartGraph(draft);
    expect(start.vertices.length).toBe(1);
    expect(start.isDirected).toBe(true);
  });

  it("shows the task graph in the condition only when it is given", () => {
    const draft = createTaskDraft();
    draft.graph = addVertex(draft.graph, 5, 5);
    expect(taskGraph(draft)).toBeNull();
    draft.hasGraph = true;
    draft.rules.direction = "directed";
    const graph = taskGraph(draft);
    expect(graph).not.toBeNull();
    if (graph !== null) {
      expect(graph.vertices.length).toBe(1);
      expect(graph.isDirected).toBe(true);
    }
  });

  it("lets the student pick the kind only for a graph drawn from scratch", () => {
    const draft = createTaskDraft();
    expect(canPickAnswerDirection(draft)).toBe(true);
    draft.rules.direction = "undirected";
    expect(canPickAnswerDirection(draft)).toBe(false);
    draft.rules.direction = "any";
    draft.hasGraph = true;
    expect(canPickAnswerDirection(draft)).toBe(false);
  });

  it("explains the limits to the student", () => {
    const draft = createTaskDraft();
    expect(studentHints(draft)).toEqual(["Граф студент рисует сам."]);
    draft.hasGraph = true;
    draft.rules.direction = "undirected";
    draft.rules.canMove = false;
    expect(studentHints(draft)).toEqual([
      "Ответ начинается с копии графа задачи.",
      "Граф в ответе может быть только неориентированным.",
      "В этой задаче нельзя двигать вершины.",
    ]);
  });

  it("names the draft and finds the tab for each readiness item", () => {
    const draft = createTaskDraft();
    expect(draftTitle(draft)).toBe("Новая задача");
    draft.name = "  Дерево ";
    expect(draftTitle(draft)).toBe("Дерево");
    expect(targetTab("name")).toBe("main");
    expect(targetTab("description")).toBe("main");
    expect(targetTab("graph")).toBe("graph");
    expect(targetTab("conditions")).toBe("conditions");
  });

  it("marks a tab done when everything on it is filled", () => {
    const draft = filledDraft();
    expect(tabIsDone(draft, "main")).toBe(true);
    expect(tabIsDone(draft, "conditions")).toBe(true);
    expect(tabIsDone(draft, "student")).toBe(false);
    draft.hasGraph = true;
    expect(tabIsDone(draft, "graph")).toBe(false);
    draft.graph = addVertex(draft.graph, 0, 0);
    expect(tabIsDone(draft, "graph")).toBe(true);
    draft.description = "";
    expect(tabIsDone(draft, "main")).toBe(false);
  });

  it("builds the student view with check names only", () => {
    const draft = filledDraft();
    draft.hasGraph = true;
    let view = studentView(draft);
    expect(view.name).toBe("Дерево");
    expect(view.graph).toBeNull();
    expect(view.checks).toEqual([
      { pluginId: "condition-1", text: "Число вершин", mistakeText: "" },
    ]);
    draft.graph = addVertex(draft.graph, 0, 0);
    view = studentView(draft);
    expect(view.graph).not.toBeNull();
    expect(JSON.stringify(view)).not.toContain("Нужно шесть вершин");
  });
});
