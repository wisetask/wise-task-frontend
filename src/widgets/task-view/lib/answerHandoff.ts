import { graphFromFileText, graphToFileText, type Graph } from "@/entities/graph";

export const HANDOFF_KEY = "wisetask.task.startAnswer";

export interface HandoffStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function handoffText(taskId: string, graph: Graph): string {
  return JSON.stringify({ taskId: taskId, graph: graphToFileText(graph) });
}

export function graphFromHandoff(text: string | null, taskId: string): Graph | null {
  if (text === null) {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || !("taskId" in data) || !("graph" in data)) {
    return null;
  }
  if (data.taskId !== taskId || typeof data.graph !== "string") {
    return null;
  }
  const result = graphFromFileText(data.graph);
  if (!result.ok) {
    return null;
  }
  return result.graph;
}

function sessionStore(): HandoffStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function handOffAnswer(taskId: string, graph: Graph, storage = sessionStore()) {
  if (storage === null) {
    return;
  }
  try {
    storage.setItem(HANDOFF_KEY, handoffText(taskId, graph));
  } catch {
    return;
  }
}

export function takeHandedAnswer(taskId: string, storage = sessionStore()): Graph | null {
  if (storage === null) {
    return null;
  }
  try {
    const graph = graphFromHandoff(storage.getItem(HANDOFF_KEY), taskId);
    storage.removeItem(HANDOFF_KEY);
    return graph;
  } catch {
    return null;
  }
}
