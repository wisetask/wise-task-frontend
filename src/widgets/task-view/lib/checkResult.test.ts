import { describe, expect, it } from "vitest";
import { allowEverything } from "@/widgets/graph-editor";
import {
  checkMarks,
  failedChecksText,
  failureSummary,
  mistakeDetail,
  mistakeText,
  toCheckResult,
  type BackendPluginResult,
} from "./checkResult";
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
      failedPlugins: [],
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
    expect(toCheckResult(false, results, hidden).failedPlugins).toEqual(["p1"]);
  });

  it("marks passed and failed checks", () => {
    const wrong = toCheckResult(false, [failed("p2", "Число цветов", "3")], view());
    expect(checkMarks(view(), wrong)).toEqual({ p1: "ok", p2: "fail" });
    expect(checkMarks(view(), toCheckResult(true, [], view()))).toEqual({ p1: "ok", p2: "ok" });
    expect(checkMarks(view(), null)).toEqual({});
  });

  it("does not reveal the other checks when mistakes are hidden", () => {
    const hidden = view();
    hidden.isHiddenMistake = true;
    const wrong = toCheckResult(false, [failed("p2", "Число цветов", "3")], hidden);
    expect(checkMarks(hidden, wrong)).toEqual({ p2: "fail" });
  });

  it("still says the answer is wrong without plugin results", () => {
    expect(toCheckResult(false, [], view()).mistakes).toEqual([
      { text: "Решение неверное.", detail: "" },
    ]);
  });

  it("counts failed checks in words", () => {
    expect(failedChecksText(1)).toBe("Не прошла 1 проверка");
    expect(failedChecksText(3)).toBe("Не прошли 3 проверки");
    expect(failedChecksText(5)).toBe("Не прошли 5 проверок");
    expect(failedChecksText(11)).toBe("Не прошли 11 проверок");
    expect(failedChecksText(21)).toBe("Не прошла 21 проверка");
  });

  it("names the count only when there are several mistakes", () => {
    const one = { isCorrect: false, mistakes: [{ text: "a", detail: "" }], failedPlugins: [] };
    const two = {
      isCorrect: false,
      mistakes: [
        { text: "a", detail: "" },
        { text: "b", detail: "" },
      ],
      failedPlugins: [],
    };
    expect(failureSummary(one)).toBe("Вот что не так:");
    expect(failureSummary(two)).toBe("Не прошли 2 проверки");
  });
});
