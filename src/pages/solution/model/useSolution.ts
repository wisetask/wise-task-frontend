import { ref, shallowRef } from "vue";
import { fromBackendGraph, type BackendGraph, type Graph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import {
  toCheckResult,
  tryLoadFullGraph,
  toTaskView,
  type CheckResult,
  type TaskView,
} from "@/widgets/task-view";
import { GetSolutionQuery } from "../api/getSolution";

export function useSolution() {
  const view = shallowRef<TaskView | null>(null);
  const answer = shallowRef<Graph | null>(null);
  const result = shallowRef<CheckResult | null>(null);
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
    answer.value = null;
    result.value = null;
    isUnsupported.value = false;
    try {
      const { data } = await apolloClient.query({
        query: GetSolutionQuery,
        variables: { id: id },
        fetchPolicy: "network-only",
      });
      const solution = data.getTaskSolution;
      const task = solution.task;
      if (solution.__typename !== "SolutionGraph" || !task || task.__typename !== "TaskGraph") {
        if (request === lastRequest) {
          isUnsupported.value = true;
        }
        return;
      }
      const taskGraph: BackendGraph | null = await tryLoadFullGraph(task.graph);
      const answerGraph: BackendGraph | null = await tryLoadFullGraph(solution.graph);
      if (request !== lastRequest) {
        return;
      }
      const taskView = toTaskView(task, taskGraph);
      if (taskView === null) {
        isUnsupported.value = true;
        return;
      }
      view.value = taskView;
      if (answerGraph !== null) {
        answer.value = fromBackendGraph(answerGraph).graph;
      }
      result.value = toCheckResult(solution.isCorrect, solution.pluginResults ?? [], taskView);
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

  return { view, answer, result, isUnsupported, loading, error, load };
}
