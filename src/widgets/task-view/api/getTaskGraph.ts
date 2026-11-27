import { graphql } from "@/shared/api";

export const GetTaskGraphQuery = graphql(`
  query GetTaskGraph($id: ID!) {
    getTask(id: $id) {
      __typename
      id
      ... on TaskGraph {
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
