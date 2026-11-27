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
  failedPlugins: string[];
}

export type CheckMark = "ok" | "fail";

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
    return { isCorrect: true, mistakes: [], failedPlugins: [] };
  }
  const mistakes: Mistake[] = [];
  const failedPlugins: string[] = [];
  for (const result of results) {
    if (!result.isCorrect) {
      mistakes.push({ text: mistakeText(result, view), detail: mistakeDetail(result) });
      failedPlugins.push(result.plugin ? result.plugin.id : "");
    }
  }
  if (mistakes.length === 0) {
    mistakes.push({ text: "Решение неверное.", detail: "" });
    failedPlugins.push("");
  }
  if (view.isHiddenMistake && mistakes.length > 1) {
    return { isCorrect: false, mistakes: [mistakes[0]], failedPlugins: [failedPlugins[0]] };
  }
  return { isCorrect: false, mistakes: mistakes, failedPlugins: failedPlugins };
}

export function checkMarks(view: TaskView, result: CheckResult | null): Record<string, CheckMark> {
  const marks: Record<string, CheckMark> = {};
  if (result === null) {
    return marks;
  }
  const hideRest = !result.isCorrect && view.isHiddenMistake;
  for (const check of view.checks) {
    if (result.failedPlugins.includes(check.pluginId)) {
      marks[check.pluginId] = "fail";
    } else if (!hideRest) {
      marks[check.pluginId] = "ok";
    }
  }
  return marks;
}

export function failedChecksText(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return "Не прошли " + count + " проверок";
  }
  if (last === 1) {
    return "Не прошла " + count + " проверка";
  }
  if (last >= 2 && last <= 4) {
    return "Не прошли " + count + " проверки";
  }
  return "Не прошли " + count + " проверок";
}

export function failureSummary(result: CheckResult): string {
  if (result.mistakes.length > 1) {
    return failedChecksText(result.mistakes.length);
  }
  return "Вот что не так:";
}
