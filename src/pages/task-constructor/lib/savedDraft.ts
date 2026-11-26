import { graphFromFileText, graphToFileText } from "@/entities/graph";
import type { TaskCondition } from "@/features/task-conditions";
import { DIRECTIONS, type EditorRules, type GraphDirection } from "@/widgets/graph-editor";
import type { TaskDraft } from "../model/taskDraft";

export const DRAFT_KEY = "wisetask.constructor.draft";

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SavedDraft {
  name: string;
  category: string;
  description: string;
  isPublic: boolean;
  hasGraph: boolean;
  graph: string;
  rules: EditorRules;
  conditions: TaskCondition[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRules(value: unknown): EditorRules | null {
  if (!isObject(value)) {
    return null;
  }
  const flags = ["canAdd", "canDelete", "canEditLabels", "canColor", "canMove"];
  for (const flag of flags) {
    if (typeof value[flag] !== "boolean") {
      return null;
    }
  }
  if (typeof value.direction !== "string") {
    return null;
  }
  const direction = value.direction as GraphDirection;
  if (!DIRECTIONS.includes(direction)) {
    return null;
  }
  return {
    canAdd: value.canAdd === true,
    canDelete: value.canDelete === true,
    canEditLabels: value.canEditLabels === true,
    canColor: value.canColor === true,
    canMove: value.canMove === true,
    direction: direction,
  };
}

function readConditions(value: unknown): TaskCondition[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const conditions: TaskCondition[] = [];
  for (const condition of value) {
    if (!isObject(condition)) {
      return null;
    }
    const {
      id,
      pluginId,
      pluginName,
      pluginType,
      sign,
      value: conditionValue,
      mistakeText,
    } = condition;
    if (
      typeof id !== "string" ||
      typeof pluginId !== "string" ||
      pluginId.trim() === "" ||
      typeof pluginName !== "string" ||
      typeof sign !== "string" ||
      typeof conditionValue !== "string" ||
      typeof mistakeText !== "string"
    ) {
      return null;
    }
    if (
      pluginType !== "GRAPH_PROPERTY" &&
      pluginType !== "GRAPH_CHARACTERISTIC" &&
      pluginType !== "GRAPH_NEW_GRAPH" &&
      pluginType !== "GRAPH_STRING"
    ) {
      return null;
    }
    conditions.push({
      id,
      pluginId,
      pluginName,
      pluginType,
      sign,
      value: conditionValue,
      mistakeText,
    });
  }
  return conditions;
}

export function draftToText(draft: TaskDraft): string {
  const saved: SavedDraft = {
    name: draft.name,
    category: draft.category,
    description: draft.description,
    isPublic: draft.isPublic,
    hasGraph: draft.hasGraph,
    graph: graphToFileText(draft.graph),
    rules: draft.rules,
    conditions: draft.conditions,
  };
  return JSON.stringify(saved);
}

export function draftFromText(text: string): TaskDraft | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(data)) {
    return null;
  }
  const texts = ["name", "category", "description", "graph"];
  for (const key of texts) {
    if (typeof data[key] !== "string") {
      return null;
    }
  }
  const switches = ["isPublic", "hasGraph"];
  for (const key of switches) {
    if (typeof data[key] !== "boolean") {
      return null;
    }
  }
  const rules = readRules(data.rules);
  if (rules === null) {
    return null;
  }
  const graph = graphFromFileText(data.graph as string);
  if (!graph.ok) {
    return null;
  }
  const conditions = readConditions(data.conditions);
  if (conditions === null) {
    return null;
  }
  return {
    name: data.name as string,
    category: data.category as string,
    description: data.description as string,
    isPublic: data.isPublic === true,
    hasGraph: data.hasGraph === true,
    graph: graph.graph,
    rules: rules,
    conditions,
  };
}

export function browserStorage(): DraftStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadDraft(storage: DraftStorage | null): TaskDraft | null {
  if (storage === null) {
    return null;
  }
  try {
    const text = storage.getItem(DRAFT_KEY);
    if (text === null) {
      return null;
    }
    return draftFromText(text);
  } catch {
    return null;
  }
}

export function saveDraft(storage: DraftStorage | null, draft: TaskDraft): boolean {
  if (storage === null) {
    return false;
  }
  try {
    storage.setItem(DRAFT_KEY, draftToText(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(storage: DraftStorage | null) {
  if (storage === null) {
    return;
  }
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    return;
  }
}
