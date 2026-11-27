import { ref, shallowRef } from "vue";
import { fromBackendGraph, type Graph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { tryLoadFullGraph } from "@/widgets/task-view";
import { GetAttemptGraphQuery, GetTaskAttemptsQuery } from "../api/getAttempts";
import { GetNextTasksQuery } from "../api/getNextTasks";
import { pickNextTask, recentAttempts, type Attempt, type TaskLink } from "./nextTask";

export const NEXT_POOL_SIZE = 30;
export const ATTEMPTS_PAGE_SIZE = 100;

const attemptGraphs = new Map<string, Promise<Graph | null>>();

async function fetchAttemptGraph(id: string): Promise<Graph | null> {
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

export function loadAttemptGraph(id: string): Promise<Graph | null> {
  const known = attemptGraphs.get(id);
  if (known !== undefined) {
    return known;
  }
  const promise = fetchAttemptGraph(id);
  attemptGraphs.set(id, promise);
  return promise;
}

export function useAttempts() {
  const attempts = shallowRef<Attempt[]>([]);
  const total = ref(0);
  let lastRequest = 0;

  async function load(taskId: string, authorId: string) {
    if (taskId === "" || authorId === "") {
      attempts.value = [];
      total.value = 0;
      return;
    }
    lastRequest = lastRequest + 1;
    const request = lastRequest;
    try {
      const { data } = await apolloClient.query({
        query: GetTaskAttemptsQuery,
        variables: { taskId: taskId, authorId: authorId, pageSize: ATTEMPTS_PAGE_SIZE },
        fetchPolicy: "network-only",
      });
      if (request !== lastRequest) {
        return;
      }
      const items: Attempt[] = [];
      for (const item of data.getAllTaskSolutions.items ?? []) {
        items.push({ id: item.id, isCorrect: item.isCorrect });
      }
      total.value = items.length;
      attempts.value = recentAttempts(items);
    } catch {
      return;
    }
  }

  return { attempts, total, load };
}

export function useNextTask() {
  const next = shallowRef<TaskLink | null>(null);

  async function load(currentId: string, category: string) {
    next.value = null;
    try {
      const { data } = await apolloClient.query({
        query: GetNextTasksQuery,
        variables: {
          category: category.trim() === "" ? null : category.trim(),
          pageSize: NEXT_POOL_SIZE,
        },
      });
      const items: TaskLink[] = [];
      for (const item of data.getAllTasks.items ?? []) {
        items.push({ id: item.id, name: item.name });
      }
      next.value = pickNextTask(items, currentId, Math.random());
    } catch {
      next.value = null;
    }
  }

  return { next, load };
}
