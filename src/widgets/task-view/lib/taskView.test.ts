import { describe, expect, it } from "vitest";
import {
  answerStartsFromTask,
  canPickDirection,
  checkText,
  graphToLoad,
  startAnswer,
  taskHints,
  toTaskView,
  type BackendTask,
} from "./taskView";

function coloringTask(): BackendTask {
  return {
    __typename: "TaskGraph",
    id: "15",
    name: "Раскраска",
    description: "Раскрасьте вершины",
    category: "Раскраска графов",
    author: { firstName: "Егор", lastName: "Малютин" },
    isHiddenMistake: false,
    rule: { isColor: true, isEdit: false, isMove: true, isDelete: false },
    graph: {
      id: "g1",
      isDirect: true,
      vertexList: [
        { id: 1, weight: 0, label: "1", xCoordinate: 0, yCoordinate: 0, color: "GRAY" },
        { id: 2, weight: 0, label: "2", xCoordinate: 100, yCoordinate: 0, color: "GRAY" },
      ],
      edgeList: [{ source: 1, target: 2, weight: 0, label: "", color: "GRAY" }],
    },
    conditions: [
      {
        plugin: { id: "p1", name: "Правильная раскраска" },
        value: "true",
        mistakeText: "Соседние вершины одного цвета",
        sign: null,
        pluginType: "GRAPH_PROPERTY",
      },
      {
        plugin: { id: "p2", name: "Число цветов" },
        value: "2",
        mistakeText: null,
        sign: "<=",
        pluginType: "GRAPH_CHARACTERISTIC",
      },
    ],
  };
}

describe("task view", () => {
  it("reads a graph task from the backend", () => {
    const view = toTaskView(coloringTask());
    expect(view).not.toBeNull();
    if (view === null) {
      return;
    }
    expect(view.author).toBe("Малютин Егор");
    expect(view.graph?.vertices.length).toBe(2);
    expect(view.graph?.isDirected).toBe(true);
    expect(view.rules.canAdd).toBe(false);
    expect(view.rules.canEditLabels).toBe(false);
    expect(view.rules.canColor).toBe(true);
    expect(view.checks.length).toBe(2);
    expect(view.checks[0].mistakeText).toBe("Соседние вершины одного цвета");
    expect(view.checks[1].text).toBe("Число цветов");
  });

  it("loads the graph separately when the task gives only its id", () => {
    const task = coloringTask();
    expect(graphToLoad(task.graph)).toBeNull();
    const full = task.graph;
    if (!full) {
      return;
    }
    task.graph = { id: "g1", isDirect: true, vertexList: [], edgeList: [] };
    expect(graphToLoad(task.graph)).toBe("g1");
    const view = toTaskView(task, full);
    expect(view?.graph?.vertices.length).toBe(2);
    expect(graphToLoad(null)).toBeNull();
    expect(graphToLoad({ isDirect: false, vertexList: [], edgeList: [] })).toBeNull();
  });

  it("treats a graph without vertices as no graph", () => {
    const task = coloringTask();
    task.graph = { id: "g1", isDirect: false, vertexList: [], edgeList: [] };
    const view = toTaskView(task);
    expect(view?.graph).toBeNull();
  });

  it("does not open tasks on code", () => {
    const task = coloringTask();
    task.__typename = "TaskImplementation";
    expect(toTaskView(task)).toBeNull();
  });

  it("names the checks without giving away the expected values", () => {
    const characteristic = {
      plugin: { id: "p", name: "Хроматический индекс" },
      value: "5",
      sign: "=",
      pluginType: "GRAPH_CHARACTERISTIC",
    };
    expect(checkText(characteristic)).toBe("Хроматический индекс");
    expect(checkText({ plugin: null, value: "true", pluginType: "GRAPH_PROPERTY" })).toBe(
      "Проверка",
    );
  });

  it("starts the answer from a copy of the task graph even if adding is allowed", () => {
    const view = toTaskView(coloringTask());
    if (view === null) {
      return;
    }
    view.rules.canAdd = true;
    expect(answerStartsFromTask(view)).toBe(true);
    expect(startAnswer(view).vertices.length).toBe(2);
    expect(canPickDirection(view)).toBe(false);
  });

  it("gives an empty answer when the task has no graph", () => {
    const task = coloringTask();
    task.graph = null;
    const view = toTaskView(task);
    if (view === null) {
      return;
    }
    expect(startAnswer(view).vertices.length).toBe(0);
    expect(canPickDirection(view)).toBe(true);
    expect(taskHints(view)).toEqual(["Граф нарисуйте сами."]);
  });

  it("explains the limits", () => {
    const view = toTaskView(coloringTask());
    if (view === null) {
      return;
    }
    const hints = taskHints(view);
    expect(hints[0]).toBe("Ответ начинается с копии графа задачи.");
    expect(hints.length).toBe(2);
  });
});
