import { graphql } from "@/shared/api";

export const GetSolutionQuery = graphql(`
  query GetSolution($id: ID!) {
    getTaskSolution(id: $id) {
      __typename
      id
      isCorrect
      task {
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
        pluginResults {
          plugin {
            id
            name
          }
          isCorrect
          value
          trueValue
          pluginMessage
        }
      }
    }
  }
`);
