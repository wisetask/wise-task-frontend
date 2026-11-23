import type { Plugin, PluginType } from "./plugin";

export const propertyValues = ["Выполняется", "Не выполняется"] as const;
export const comparisonSigns = ["=", ">", "<"] as const;

export interface TaskCondition {
  pluginId: string;
  pluginName: string;
  pluginType: PluginType;
  sign: string;
  value: string;
  mistakeText: string;
}

type ConditionChanges = Partial<Pick<TaskCondition, "sign" | "value" | "mistakeText">>;
type PluginInfoInput = Omit<TaskCondition, "pluginName"> & { order: number };

export function conditionFromPlugin(plugin: Plugin): TaskCondition {
  const isCharacteristic = plugin.pluginType === "GRAPH_CHARACTERISTIC";
  return {
    pluginId: plugin.id,
    pluginName: plugin.name,
    pluginType: plugin.pluginType,
    sign: isCharacteristic ? "=" : "",
    value: isCharacteristic ? "1" : propertyValues[0],
    mistakeText: plugin.description,
  };
}

export function addCondition(list: readonly TaskCondition[], condition: TaskCondition) {
  return [...list, condition];
}

export function removeCondition(list: readonly TaskCondition[], index: number) {
  return list.filter((_, currentIndex) => currentIndex !== index);
}

export function moveCondition(list: readonly TaskCondition[], from: number, to: number) {
  const result = [...list];
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < 0 || to >= list.length) {
    return result;
  }
  const condition = list[from];
  if (condition !== undefined) {
    result.splice(from, 1);
    result.splice(to, 0, condition);
  }
  return result;
}

export function changeCondition(
  list: readonly TaskCondition[],
  index: number,
  changes: ConditionChanges,
) {
  return list.map((condition, currentIndex) =>
    currentIndex === index ? { ...condition, ...changes } : condition,
  );
}

export function conditionError(condition: TaskCondition, field?: "value" | "mistakeText"): string {
  if (
    field !== "mistakeText" &&
    condition.pluginType === "GRAPH_CHARACTERISTIC" &&
    !/^[+-]?\d+$/.test(condition.value.trim())
  ) {
    return "Введите целое число";
  }
  if (field !== "value" && condition.mistakeText.trim() === "") {
    return "Введите текст ошибки";
  }
  return "";
}

export function toPluginInfoInput(list: readonly TaskCondition[]): PluginInfoInput[] {
  return list.map(({ pluginId, pluginType, sign, value, mistakeText }, index) => ({
    pluginId,
    pluginType,
    sign,
    value,
    mistakeText,
    order: index + 1,
  }));
}
