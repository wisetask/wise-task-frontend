import { graphql } from "@/shared/api";

export const GetMySolutionsQuery = graphql(`
  query GetMySolutions($authorId: String!, $isCorrect: Boolean, $page: Int!, $pageSize: Int!) {
    getAllTaskSolutions(
      request: {
        authorId: $authorId
        isCorrect: $isCorrect
        pagination: { page: $page, pageSize: $pageSize }
      }
    ) {
      items {
        __typename
        id
        isCorrect
        task {
          id
          name
          category
        }
      }
      pagination {
        hasNext
        totalCount
      }
    }
  }
`);
