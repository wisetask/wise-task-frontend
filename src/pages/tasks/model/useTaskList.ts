import { ref, shallowRef } from "vue";
import { apolloClient } from "@/shared/api";
import { GetTasksQuery } from "../api/getTasks";
import { filterValue, toListItem, type TaskFilter, type TaskListItem } from "./taskList";

export const PAGE_SIZE = 20;

export function useTaskList() {
  const tasks = ref<TaskListItem[]>([]);
  const totalCount = ref<number | null>(null);
  const hasNext = ref(false);
  const loading = ref(false);
  const error = shallowRef<unknown>(null);
  const generation = ref(0);
  let nextPage = 0;
  let lastRequest = 0;

  async function loadPage(filter: TaskFilter, page: number) {
    lastRequest = lastRequest + 1;
    const request = lastRequest;
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apolloClient.query({
        query: GetTasksQuery,
        variables: {
          page: page,
          pageSize: PAGE_SIZE,
          name: filterValue(filter.name),
          category: filterValue(filter.category),
        },
        fetchPolicy: "network-only",
      });
      if (request !== lastRequest) {
        return;
      }
      const items: TaskListItem[] = [];
      for (const item of data.getAllTasks.items ?? []) {
        items.push(toListItem(item));
      }
      if (page === 0) {
        tasks.value = items;
        generation.value = generation.value + 1;
      } else {
        tasks.value = tasks.value.concat(items);
      }
      const pagination = data.getAllTasks.pagination;
      hasNext.value = pagination?.hasNext === true;
      totalCount.value = pagination?.totalCount ?? null;
      nextPage = page + 1;
    } catch (caught) {
      if (request === lastRequest) {
        error.value = caught;
      }
    } finally {
      if (request === lastRequest) {
        loading.value = false;
      }
    }
  }

  async function pickRandom(filter: TaskFilter): Promise<TaskListItem | null> {
    const total = totalCount.value;
    if (total === null || total === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * total);
    try {
      const { data } = await apolloClient.query({
        query: GetTasksQuery,
        variables: {
          page: index,
          pageSize: 1,
          name: filterValue(filter.name),
          category: filterValue(filter.category),
        },
        fetchPolicy: "network-only",
      });
      const items = data.getAllTasks.items ?? [];
      if (items.length === 0) {
        return null;
      }
      return toListItem(items[0]);
    } catch {
      return null;
    }
  }

  function search(filter: TaskFilter) {
    return loadPage(filter, 0);
  }

  function loadMore(filter: TaskFilter) {
    return loadPage(filter, nextPage);
  }

  return { tasks, totalCount, hasNext, loading, error, generation, search, loadMore, pickRandom };
}
