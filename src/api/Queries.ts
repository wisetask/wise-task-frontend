import gql from "graphql-tag";

export const GET_ALL_PROFILES_QUERY = gql`
  query getAllProfiles(
    $request: GetAllProfilesRequestInput! = { pagination: { page: 0, pageSize: 100 } }
  ) {
    getAllProfiles(request: $request) {
      items {
        id
        email
        profilePassword
        firstName
        lastName
        patronymic
        profileRole
      }
      pagination {
        page
        pageSize
        totalCount
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
`;

export const GET_PROFILE = gql`
  query getProfile($id: ID!) {
    getProfile(id: $id) {
      id
      email
      profilePassword
      firstName
      lastName
      patronymic
      profileRole
    }
  }
`;

export const GET_MY_PROFILE = gql`
  query getMyProfile {
    getMyProfile {
      id
      email
      firstName
      lastName
      patronymic
      profileRole
    }
  }
`;

export const GET_TASK = gql`
  query getTask($id: ID!) {
    getTask(id: $id) {
      id
      name
      description
      category
      taskType
      isPublic
      author {
        id
        email
        firstName
        lastName
        patronymic
        profileRole
      }
      __typename
      ... on TaskGraph {
        isHiddenMistake
        graph {
          id
          vertexCount
          edgeCount
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
            pluginType
          }
          value
          mistakeText
          sign
          pluginType
        }
      }
      ... on TaskImplementation {
        plugin {
          id
          name
          pluginType
        }
      }
    }
  }
`;

export const GET_GRAPH_BY_ID = gql`
  query GetGraphById($id: ID!) {
    getGraphById(id: $id) {
      id
      isDirect
      isNamed
      name
      vertexCount
      edgeCount
      vertexList {
        id
        label
        color
        weight
        xCoordinate
        yCoordinate
      }
      edgeList {
        source
        target
        label
        color
        weight
      }
    }
  }
`;

export const GET_ALL_TASK_SOLUTIONS = gql`
  query getAllTaskSolutions(
    $request: GetAllTaskSolutionsRequestInput! = { pagination: { page: 0, pageSize: 100 } }
  ) {
    getAllTaskSolutions(request: $request) {
      items {
        id
        isCorrect
        __typename
        author {
          id
        }
        task {
          id
          name
          taskType
        }
        ... on SolutionGraph {
          graph {
            id
          }
          pluginResults {
            plugin {
              id
            }
            isCorrect
            value
            trueValue
            pluginMessage
          }
        }
        ... on SolutionImplementation {
          implementationResult {
            id
            originalTimeResult
            timeResult
            originalResult
            result
          }
        }
      }
      pagination {
        page
        pageSize
        totalCount
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
`;

export const GET_SOLUTION_WITH_TASK_DESCRIPTION = gql`
  query getSolutionWithTaskDescription($taskId: ID!, $solutionId: ID!) {
    getTaskSolution(id: $solutionId) {
      id
      isCorrect
      __typename
      author {
        id
      }
      ... on SolutionGraph {
        graph {
          id
          vertexCount
          edgeCount
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
    getTask(id: $taskId) {
      description
    }
  }
`;

export const GET_ALL_GRAPHS = gql`
  query getAllGraphs(
    $request: GetAllGraphsRequestInput! = { pagination: { page: 0, pageSize: 100 } }
  ) {
    getAllGraphs(request: $request) {
      items {
        id
        vertexCount
        edgeCount
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
        isNamed
        name
        author {
          id
          email
          firstName
          lastName
          patronymic
          profileRole
        }
      }
      pagination {
        page
        pageSize
        totalCount
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
`;

export const GET_ALL_PLUGINS = gql`
  query getAllPlugins(
    $request: GetAllPluginRequestInput! = { pagination: { page: 0, pageSize: 100 } }
  ) {
    getAllPlugins(request: $request) {
      items {
        id
        name
        description
        category
        graphType
        isValid
        beanName
        pluginType
        isInternal
        author {
          id
          email
          firstName
          lastName
          patronymic
          profileRole
        }
      }
      pagination {
        page
        pageSize
        totalCount
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
`;

export const GET_ALL_TASKS = gql`
  query getAllTasks(
    $request: GetAllTaskRequestInput! = { pagination: { page: 0, pageSize: 100 } }
  ) {
    getAllTasks(request: $request) {
      items {
        id
        name
        description
        category
        taskType
        isPublic
        author {
          id
          email
          firstName
          lastName
          patronymic
          profileRole
        }
      }
      pagination {
        page
        pageSize
        totalCount
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
`;

export const GET_STATISTIC = gql`
  query GetStatistic($request: StatisticRequestInput!) {
    getStatistic(request: $request) {
      scope
      type
      updated_at
      task_id
      user_id
      value
      event_type
    }
  }
`