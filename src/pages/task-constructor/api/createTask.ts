import { graphql } from "@/shared/api";

export const CreateTaskGraphMutation = graphql(`
  mutation CreateTaskGraph($task: TaskGraphInput!) {
    createTaskGraph(task: $task) {
      id
      name
    }
  }
`);
