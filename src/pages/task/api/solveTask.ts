import { graphql } from "@/shared/api";

export const SolveTaskGraphMutation = graphql(`
  mutation SolveTaskGraph($solution: SolutionGraphInput!) {
    solveTaskGraph(solution: $solution) {
      id
      isCorrect
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
`);
