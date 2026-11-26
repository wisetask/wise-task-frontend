import { ref, shallowRef } from "vue";
import { apolloClient } from "@/shared/api";
import type { BackendGraph } from "@/entities/graph";
import { GetTaskGraphQuery } from "../api/getGraph";
import { GetTaskQuery } from "../api/getTask";
import { graphToLoad, toTaskView, type TaskView } from "./taskView";

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
      let loadedGraph: BackendGraph | null = null;
      const graphId = graphToLoad(data.getTask);
      if (graphId !== null) {
        const graphResponse = await apolloClient.query({
          query: GetTaskGraphQuery,
          variables: { id: graphId },
          fetchPolicy: "network-only",
        });
        if (request !== lastRequest) {
          return;
        }
        loadedGraph = graphResponse.data.getGraphById;
      }
      const result = toTaskView(data.getTask, loadedGraph);
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
