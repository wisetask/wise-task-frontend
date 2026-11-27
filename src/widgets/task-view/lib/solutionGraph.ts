import { fromBackendGraph, type Graph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { GetAttemptGraphQuery, GetTaskAttemptsQuery } from "../api/getSolutionGraph";
import { tryLoadFullGraph } from "./loadGraph";

export interface AttemptItem {
  id: string;
  isCorrect: boolean;
}

export const ATTEMPTS_PAGE_SIZE = 100;

const solutionGraphs = new Map<string, Promise<Graph | null>>();

async function fetchSolutionGraph(id: string): Promise<Graph | null> {
  try {
    const { data } = await apolloClient.query({
      query: GetAttemptGraphQuery,
      variables: { id: id },
    });
    const solution = data.getTaskSolution;
    if (solution.__typename !== "SolutionGraph") {
      return null;
    }
    const full = await tryLoadFullGraph(solution.graph);
    if (full === null) {
      return null;
    }
    const graph = fromBackendGraph(full).graph;
    return graph.vertices.length === 0 ? null : graph;
  } catch {
    return null;
  }
}

export function loadSolutionGraph(id: string): Promise<Graph | null> {
  const known = solutionGraphs.get(id);
  if (known !== undefined) {
    return known;
  }
  const promise = fetchSolutionGraph(id);
  solutionGraphs.set(id, promise);
  return promise;
}

export async function loadTaskAttempts(
  taskId: string,
  authorId: string,
): Promise<AttemptItem[] | null> {
  if (taskId === "" || authorId === "") {
    return [];
  }
  try {
    const { data } = await apolloClient.query({
      query: GetTaskAttemptsQuery,
      variables: { taskId: taskId, authorId: authorId, pageSize: ATTEMPTS_PAGE_SIZE },
      fetchPolicy: "network-only",
    });
    const items: AttemptItem[] = [];
    for (const item of data.getAllTaskSolutions.items ?? []) {
      items.push({ id: item.id, isCorrect: item.isCorrect });
    }
    return items;
  } catch {
    return null;
  }
}
