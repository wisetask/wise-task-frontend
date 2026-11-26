import { graphql } from "@/shared/api";

export const GetFullGraphQuery = graphql(`
  query GetFullGraph($id: ID!) {
    getGraphById(id: $id) {
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
`);
