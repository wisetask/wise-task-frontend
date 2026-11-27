import { createId } from "@/shared/lib/createId";
import type { Plugin, PluginType } from "./plugin";

export const propertyValues = ["Выполняется", "Не выполняется"];
export const comparisonSigns = ["=", ">", "<"];

export interface TaskCondition {
  id: string;
  pluginId: string;
  pluginName: string;
  pluginType: PluginType;
  sign: string;
  value: string;
  mistakeText: string;
}

interface ConditionChanges {
  sign?: string;
  value?: string;
  mistakeText?: string;
}

export interface PluginInfoInput {
  pluginId: string;
  pluginType: PluginType;
  sign: string;
  value: string;
  mistakeText: string;
  order: number;
}

export function conditionFromPlugin(plugin: Plugin): TaskCondition {
  const isCharacteristic = plugin.pluginType === "GRAPH_CHARACTERISTIC";
  return {
    id: createId(),
    pluginId: plugin.id,
    pluginName: plugin.name,
    pluginType: plugin.pluginType,
    sign: isCharacteristic ? "=" : "",
    value: isCharacteristic ? "1" : propertyValues[0],
    mistakeText: plugin.description,
  };
}

export function addCondition(list: readonly TaskCondition[], condition: TaskCondition) {
  const result = list.slice();
  result.push(condition);
  return result;
}

export function removeCondition(list: readonly TaskCondition[], index: number) {
  const result = list.slice();
  if (Number.isInteger(index) && index >= 0 && index < result.length) {
    result.splice(index, 1);
  }
  return result;
}

export function moveCondition(list: readonly TaskCondition[], from: number, to: number) {
  const result = list.slice();
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
  const result = list.slice();
  const condition = list[index];
  if (condition !== undefined) {
    result[index] = {
      id: condition.id,
      pluginId: condition.pluginId,
      pluginName: condition.pluginName,
      pluginType: condition.pluginType,
      sign: changes.sign ?? condition.sign,
      value: changes.value ?? condition.value,
      mistakeText: changes.mistakeText ?? condition.mistakeText,
    };
  }
  return result;
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
  const result: PluginInfoInput[] = [];
  for (const condition of list) {
    result.push({
      pluginId: condition.pluginId,
      pluginType: condition.pluginType,
      sign: condition.sign,
      value: condition.value,
      mistakeText: condition.mistakeText,
      order: result.length + 1,
    });
  }
  return result;
}
