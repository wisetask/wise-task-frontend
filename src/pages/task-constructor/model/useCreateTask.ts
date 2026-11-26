import { useMutation } from "@vue/apollo-composable";
import { createId } from "@/shared/lib/createId";
import { CreateTaskGraphMutation } from "../api/createTask";
import { toTaskGraphInput } from "./taskInput";
import type { TaskDraft } from "./taskDraft";

export interface CreatedTask {
  id: string;
  name: string;
}

export function useCreateTask() {
  const { mutate, loading, error } = useMutation(CreateTaskGraphMutation, { throws: "never" });

  async function createTask(draft: TaskDraft): Promise<CreatedTask | null> {
    const input = toTaskGraphInput(draft);
    input.id = createId();
    if (input.graph !== null) {
      input.graph.id = createId();
    }
    const result = await mutate({ task: input });
    const task = result?.data?.createTaskGraph;
    if (!task) {
      return null;
    }
    return { id: task.id, name: task.name };
  }

  return { createTask, loading, error };
}
