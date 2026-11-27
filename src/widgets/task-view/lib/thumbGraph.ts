import { fromBackendGraph, type BackendGraph, type Graph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { GetTaskGraphQuery } from "../api/getTaskGraph";
import { tryLoadFullGraph } from "./loadGraph";

const loaded = new Map<string, Promise<Graph | null>>();

export function graphOrNull(data: BackendGraph | null): Graph | null {
  if (data === null) {
    return null;
  }
  const graph = fromBackendGraph(data).graph;
  if (graph.vertices.length === 0) {
    return null;
  }
  return graph;
}

async function fetchTaskGraph(taskId: string): Promise<Graph | null> {
  try {
    const { data } = await apolloClient.query({
      query: GetTaskGraphQuery,
      variables: { id: taskId },
    });
    const task = data.getTask;
    if (task.__typename !== "TaskGraph") {
      return null;
    }
    const full = await tryLoadFullGraph(task.graph);
    return graphOrNull(full);
  } catch {
    return null;
  }
}

export function loadThumbGraph(taskId: string): Promise<Graph | null> {
  const known = loaded.get(taskId);
  if (known !== undefined) {
    return known;
  }
  const promise = fetchTaskGraph(taskId);
  loaded.set(taskId, promise);
  return promise;
}
