import { graphql } from "@/shared/api";

export const GetNextTasksQuery = graphql(`
  query GetNextTasks($category: String, $pageSize: Int!) {
    getAllTasks(
      request: {
        pagination: { page: 0, pageSize: $pageSize }
        filter: { category: $category, taskType: GRAPH }
      }
    ) {
      items {
        id
        name
      }
    }
  }
`);
