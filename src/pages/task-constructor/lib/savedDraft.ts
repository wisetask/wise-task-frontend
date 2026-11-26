import { graphFromFileText, graphToFileText } from "@/entities/graph";
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

export function draftToText(draft: TaskDraft): string {
  const saved: SavedDraft = {
    name: draft.name,
    category: draft.category,
    description: draft.description,
    isPublic: draft.isPublic,
    hasGraph: draft.hasGraph,
    graph: graphToFileText(draft.graph),
    rules: draft.rules,
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
  return {
    name: data.name as string,
    category: data.category as string,
    description: data.description as string,
    isPublic: data.isPublic === true,
    hasGraph: data.hasGraph === true,
    graph: graph.graph,
    rules: rules,
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
