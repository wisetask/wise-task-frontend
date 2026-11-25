import { graphql } from "@/shared/api";

export const GetTaskConditionPlugins = graphql(`
  query GetTaskConditionPlugins($page: Int!, $pageSize: Int!) {
    getAllPlugins(
      request: { filter: { isValid: true }, pagination: { page: $page, pageSize: $pageSize } }
    ) {
      items {
        id
        name
        description
        category
        pluginType
        graphType
        isValid
      }
      pagination {
        hasNext
      }
    }
  }
`);
