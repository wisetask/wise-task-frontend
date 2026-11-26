import { useMutation } from "@vue/apollo-composable";
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
    const result = await mutate({ task: toTaskGraphInput(draft) });
    const task = result?.data?.createTaskGraph;
    if (!task) {
      return null;
    }
    return { id: task.id, name: task.name };
  }

  return { createTask, loading, error };
}
