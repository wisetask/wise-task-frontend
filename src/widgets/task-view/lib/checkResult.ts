import type { TaskView } from "./taskView";

export interface BackendPluginResult {
  plugin?: { id: string; name: string } | null;
  isCorrect: boolean;
  value: string;
  trueValue: string;
  pluginMessage: string;
}

export interface Mistake {
  text: string;
  detail: string;
}

export interface CheckResult {
  isCorrect: boolean;
  mistakes: Mistake[];
}

export function mistakeText(result: BackendPluginResult, view: TaskView): string {
  if (result.plugin) {
    for (const check of view.checks) {
      if (check.pluginId === result.plugin.id && check.mistakeText !== "") {
        return check.mistakeText;
      }
    }
  }
  if (result.pluginMessage !== "") {
    return result.pluginMessage;
  }
  if (result.plugin) {
    return "Не выполнено: " + result.plugin.name;
  }
  return "Одна из проверок не пройдена.";
}

export function mistakeDetail(result: BackendPluginResult): string {
  if (result.value === "" || result.value === "true" || result.value === "false") {
    return "";
  }
  return "У вас получилось: " + result.value;
}

export function toCheckResult(
  isCorrect: boolean,
  results: BackendPluginResult[],
  view: TaskView,
): CheckResult {
  if (isCorrect) {
    return { isCorrect: true, mistakes: [] };
  }
  const mistakes: Mistake[] = [];
  for (const result of results) {
    if (!result.isCorrect) {
      mistakes.push({ text: mistakeText(result, view), detail: mistakeDetail(result) });
    }
  }
  if (mistakes.length === 0) {
    mistakes.push({ text: "Решение неверное.", detail: "" });
  }
  if (view.isHiddenMistake && mistakes.length > 1) {
    return { isCorrect: false, mistakes: [mistakes[0]] };
  }
  return { isCorrect: false, mistakes: mistakes };
}
