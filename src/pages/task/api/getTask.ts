import { graphql } from "@/shared/api";

export const GetTaskQuery = graphql(`
  query GetTask($id: ID!) {
    getTask(id: $id) {
      __typename
      id
      name
      description
      category
      author {
        firstName
        lastName
      }
      ... on TaskGraph {
        isHiddenMistake
        rule {
          isColor
          isEdit
          isMove
          isDelete
        }
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
        conditions {
          plugin {
            id
            name
          }
          value
          mistakeText
          sign
          pluginType
        }
      }
    }
  }
`);
