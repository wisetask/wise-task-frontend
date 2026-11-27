import { graphql } from "@/shared/api";

export const GetMyTaskMarksQuery = graphql(`
  query GetMyTaskMarks($authorId: String!, $page: Int!, $pageSize: Int!) {
    getAllTaskSolutions(
      request: { authorId: $authorId, pagination: { page: $page, pageSize: $pageSize } }
    ) {
      items {
        id
        isCorrect
        task {
          id
        }
      }
      pagination {
        hasNext
      }
    }
  }
`);
