import { ref, shallowRef } from "vue";
import type { Graph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { loadSolutionGraph, loadTaskAttempts } from "@/widgets/task-view";
import { GetNextTasksQuery } from "../api/getNextTasks";
import { pickNextTask, recentAttempts, type Attempt, type TaskLink } from "./nextTask";

export const NEXT_POOL_SIZE = 30;

export function loadAttemptGraph(id: string): Promise<Graph | null> {
  return loadSolutionGraph(id);
}

export function useAttempts() {
  const attempts = shallowRef<Attempt[]>([]);
  const total = ref(0);
  let lastRequest = 0;

  async function load(taskId: string, authorId: string) {
    lastRequest = lastRequest + 1;
    const request = lastRequest;
    const items = await loadTaskAttempts(taskId, authorId);
    if (request !== lastRequest || items === null) {
      return;
    }
    total.value = items.length;
    attempts.value = recentAttempts(items);
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
