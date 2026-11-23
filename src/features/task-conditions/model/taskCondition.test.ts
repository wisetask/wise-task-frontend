import { describe, expect, it } from "vitest";
import { pluginFitsTask, type Plugin } from "./plugin";
import {
  addCondition,
  changeCondition,
  conditionError,
  conditionFromPlugin,
  moveCondition,
  removeCondition,
  toPluginInfoInput,
} from "./taskCondition";

const plugin: Plugin = {
  id: "vertices",
  name: "Число вершин",
  description: "Проверьте число вершин",
  category: "Характеристики",
  pluginType: "GRAPH_CHARACTERISTIC",
  graphType: "ANY",
  isValid: true,
};
const vertices = conditionFromPlugin(plugin);
const connected = conditionFromPlugin({
  ...plugin,
  id: "connected",
  name: "Граф связный",
  pluginType: "GRAPH_PROPERTY",
});
const conditions = Object.freeze([Object.freeze(vertices), Object.freeze(connected)]);

describe("task conditions", () => {
  it("initializes conditions according to plugin type", () => {
    expect(vertices).toEqual({
      pluginId: plugin.id,
      pluginName: plugin.name,
      pluginType: plugin.pluginType,
      sign: "=",
      value: "1",
      mistakeText: plugin.description,
    });
    for (const pluginType of ["GRAPH_PROPERTY", "GRAPH_NEW_GRAPH", "GRAPH_STRING"] as const) {
      expect(conditionFromPlugin({ ...plugin, pluginType })).toMatchObject({
        pluginType,
        sign: "",
        value: "Выполняется",
      });
    }
  });

  it("adds, removes and changes conditions without mutating the list", () => {
    expect(addCondition(conditions, vertices)).toEqual([vertices, connected, vertices]);
    expect(removeCondition(conditions, 0)).toEqual([connected]);
    expect(removeCondition(conditions, -1)).toEqual(conditions);
    expect(
      changeCondition(conditions, 0, { value: "6", sign: ">", mistakeText: "Мало вершин" }),
    ).toEqual([{ ...vertices, value: "6", sign: ">", mistakeText: "Мало вершин" }, connected]);
    expect(changeCondition(conditions, 2, { value: "6" })).toEqual(conditions);
    expect(vertices.value).toBe("1");
  });

  it("moves conditions in both directions and handles list boundaries", () => {
    expect(moveCondition(conditions, 0, 1)).toEqual([connected, vertices]);
    expect(moveCondition(conditions, 1, 0)).toEqual([connected, vertices]);
    for (const [from, to] of [
      [0, -1],
      [1, 2],
      [-1, 0],
      [2, 0],
      [0, 0],
      [0, 0.5],
    ] as const) {
      const result = moveCondition(conditions, from, to);
      expect(result).toEqual(conditions);
      expect(result).not.toBe(conditions);
    }
    expect(moveCondition([], 0, 0)).toEqual([]);
  });

  it("validates integer values and nonempty mistake text", () => {
    for (const value of ["", " ", "1.5", "1e3", "число"]) {
      expect(conditionError({ ...vertices, value })).toBe("Введите целое число");
    }
    expect(conditionError({ ...vertices, value: "-2" })).toBe("");
    expect(conditionError({ ...connected, value: "Не выполняется" })).toBe("");
    expect(conditionError({ ...connected, mistakeText: " " })).toBe("Введите текст ошибки");
    expect(conditionError({ ...vertices, value: "", mistakeText: "" }, "mistakeText")).toBe(
      "Введите текст ошибки",
    );
  });

  it("serializes the backend fields in the current order", () => {
    expect(toPluginInfoInput(moveCondition(conditions, 1, 0))).toEqual([
      {
        pluginId: "connected",
        pluginType: "GRAPH_PROPERTY",
        sign: "",
        value: "Выполняется",
        mistakeText: plugin.description,
        order: 1,
      },
      {
        pluginId: "vertices",
        pluginType: "GRAPH_CHARACTERISTIC",
        sign: "=",
        value: "1",
        mistakeText: plugin.description,
        order: 2,
      },
    ]);
    expect(toPluginInfoInput([])).toEqual([]);
  });
});

describe("pluginFitsTask", () => {
  it.each([
    ["DIRECT", true, false, true],
    ["UNDIRECT", false, true, true],
    ["ANY", true, true, true],
  ] as const)("filters plugins for %s tasks", (graphType, direct, undirect, anyGraph) => {
    expect(pluginFitsTask({ ...plugin, graphType: "DIRECT" }, graphType)).toBe(direct);
    expect(pluginFitsTask({ ...plugin, graphType: "UNDIRECT" }, graphType)).toBe(undirect);
    expect(pluginFitsTask(plugin, graphType)).toBe(anyGraph);
  });
});
