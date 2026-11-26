import { ref, shallowRef } from "vue";
import { toGraphInput, type Graph } from "@/entities/graph";
import { apolloClient } from "@/shared/api";
import { createId } from "@/shared/lib/createId";
import { SolveTaskGraphMutation } from "../api/solveTask";
import { toCheckResult, type CheckResult } from "./checkResult";
import type { TaskView } from "./taskView";

export function useSolve() {
  const checking = ref(false);
  const result = shallowRef<CheckResult | null>(null);
  const error = shallowRef<unknown>(null);

  async function check(view: TaskView, answer: Graph) {
    checking.value = true;
    result.value = null;
    error.value = null;
    try {
      const { data } = await apolloClient.mutate({
        mutation: SolveTaskGraphMutation,
        variables: {
          solution: {
            id: createId(),
            taskId: view.id,
            graph: toGraphInput(answer, createId()),
          },
        },
      });
      const solution = data?.solveTaskGraph;
      if (!solution) {
        error.value = new Error("Пустой ответ сервера");
        return;
      }
      result.value = toCheckResult(solution.isCorrect, solution.pluginResults ?? [], view);
    } catch (caught) {
      error.value = caught;
    } finally {
      checking.value = false;
    }
  }

  function clear() {
    result.value = null;
    error.value = null;
  }

  return { checking, result, error, check, clear };
}
