import { ref, shallowRef } from "vue";
import type { BackendGraph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { loadFullGraph, toTaskView, type TaskView } from "@/widgets/task-view";
import { GetTaskQuery } from "../api/getTask";

export function useTask() {
  const view = shallowRef<TaskView | null>(null);
  const isUnsupported = ref(false);
  const loading = ref(false);
  const error = shallowRef<unknown>(null);
  let lastRequest = 0;

  async function load(id: string) {
    lastRequest = lastRequest + 1;
    const request = lastRequest;
    loading.value = true;
    error.value = null;
    view.value = null;
    isUnsupported.value = false;
    try {
      const { data } = await apolloClient.query({
        query: GetTaskQuery,
        variables: { id: id },
        fetchPolicy: "network-only",
      });
      if (request !== lastRequest) {
        return;
      }
      const task = data.getTask;
      let taskGraph: BackendGraph | null = null;
      if (task.__typename === "TaskGraph") {
        taskGraph = await loadFullGraph(task.graph);
      }
      if (request !== lastRequest) {
        return;
      }
      const result = toTaskView(task, taskGraph);
      if (result === null) {
        isUnsupported.value = true;
      } else {
        view.value = result;
      }
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

  return { view, isUnsupported, loading, error, load };
}
