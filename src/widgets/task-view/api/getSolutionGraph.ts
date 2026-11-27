import { graphql } from "@/shared/api";

export const GetTaskAttemptsQuery = graphql(`
  query GetTaskAttempts($taskId: String!, $authorId: String!, $pageSize: Int!) {
    getAllTaskSolutions(
      request: {
        taskId: $taskId
        authorId: $authorId
        pagination: { page: 0, pageSize: $pageSize }
      }
    ) {
      items {
        id
        isCorrect
      }
    }
  }
`);

export const GetAttemptGraphQuery = graphql(`
  query GetAttemptGraph($id: ID!) {
    getTaskSolution(id: $id) {
      __typename
      id
      ... on SolutionGraph {
        graph {
          id
          isDirect
          vertexList {
            id
            weight
            label
            xCoordinate
            yCoordinate
            color
          }
          edgeList {
            source
            target
            weight
            label
            color
          }
        }
      }
    }
  }
`);
