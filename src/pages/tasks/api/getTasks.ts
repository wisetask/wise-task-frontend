import { graphql } from "@/shared/api";

export const GetTasksQuery = graphql(`
  query GetTasks($page: Int!, $pageSize: Int!, $name: String, $category: String) {
    getAllTasks(
      request: {
        pagination: { page: $page, pageSize: $pageSize }
        filter: { name: $name, category: $category, taskType: GRAPH }
      }
    ) {
      items {
        id
        name
        description
        category
        isPublic
        author {
          firstName
          lastName
        }
      }
      pagination {
        hasNext
        totalCount
      }
    }
  }
`);
