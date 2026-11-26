import { describe, expect, it } from "vitest";
import { allowEverything } from "@/widgets/graph-editor";
import { mistakeDetail, mistakeText, toCheckResult, type BackendPluginResult } from "./checkResult";
import type { TaskView } from "./taskView";

function view(): TaskView {
  return {
    id: "15",
    name: "Раскраска",
    category: "",
    description: "",
    author: "",
    isHiddenMistake: false,
    graph: null,
    skippedEdges: 0,
    rules: allowEverything(),
    checks: [
      {
        pluginId: "p1",
        text: "Правильная раскраска",
        mistakeText: "Соседние вершины одного цвета",
      },
      { pluginId: "p2", text: "Число цветов <= 2", mistakeText: "" },
    ],
  };
}

function failed(pluginId: string, name: string, value: string): BackendPluginResult {
  return {
    plugin: { id: pluginId, name: name },
    isCorrect: false,
    value: value,
    trueValue: "2",
    pluginMessage: "",
  };
}

describe("check result", () => {
  it("has no mistakes for a correct answer", () => {
    expect(toCheckResult(true, [failed("p1", "Раскраска", "false")], view())).toEqual({
      isCorrect: true,
      mistakes: [],
    });
  });

  it("uses the author's text for a failed check", () => {
    expect(mistakeText(failed("p1", "Раскраска", "false"), view())).toBe(
      "Соседние вершины одного цвета",
    );
  });

  it("falls back to the plugin message and the plugin name", () => {
    const result = failed("p2", "Число цветов", "3");
    expect(mistakeText(result, view())).toBe("Не выполнено: Число цветов");
    result.pluginMessage = "Цветов слишком много";
    expect(mistakeText(result, view())).toBe("Цветов слишком много");
  });

  it("shows the student's value only for numbers and strings", () => {
    expect(mistakeDetail(failed("p2", "Число цветов", "3"))).toBe("У вас получилось: 3");
    expect(mistakeDetail(failed("p1", "Раскраска", "false"))).toBe("");
  });

  it("lists every failed check or only the first one", () => {
    const results = [failed("p1", "Раскраска", "false"), failed("p2", "Число цветов", "3")];
    expect(toCheckResult(false, results, view()).mistakes.length).toBe(2);
    const hidden = view();
    hidden.isHiddenMistake = true;
    expect(toCheckResult(false, results, hidden).mistakes.length).toBe(1);
  });

  it("still says the answer is wrong without plugin results", () => {
    expect(toCheckResult(false, [], view()).mistakes).toEqual([
      { text: "Решение неверное.", detail: "" },
    ]);
  });
});
