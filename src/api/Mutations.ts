import gql from 'graphql-tag'

export const SIGN_IN = gql`
    mutation signIn ($signInRequest: SignInRequest!) {
        signIn (signInRequest: $signInRequest) {
            accessToken
            refreshToken
        }
    }
`

export const SIGN_UP = gql`
    mutation signUp ($signUpRequest: SignUpRequest!) {
        signUp (signUpRequest: $signUpRequest) {
            accessToken
            refreshToken
        }
    }
`

export const UPDATE_PROFILE = gql`
    mutation updateProfile ($profile: ProfileInput!) {
        updateProfile (profile: $profile) {
            id
            email
            profilePassword
            firstName
            lastName
            patronymic
            profileRole
        }
    }
`

export const DELETE_PROFILE = gql`
    mutation DeleteProfile ($id: ID!) {
        deleteProfile (id: $id)
    }
`

export const CREATE_GRAPH = gql`
    mutation createGraph ($graph: GraphInput!) {
        createGraph (graph: $graph) {
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
        }
    }
`

export const DELETE_GRAPH = gql`
    mutation deleteGraph ($id: ID!) {
        deleteGraph (id: $id)
    }
`

export const CREATE_TASK_GRAPH = gql`
    mutation createTaskGraph ($task: TaskGraphInput!) {
        createTaskGraph (task: $task) {
            id
            name
            description
            category
            taskType
            isPublic
            isHiddenMistake
            author {
                id
            }
            rule {
                isColor
                isEdit
                isMove
                isDelete
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
`

export const DELETE_TASK = gql`
    mutation DeleteTask ($id: ID!) {
        deleteTask(id: $id)
    }
`

export const CREATE_TASK_IMPLEMENTATION = gql`
    mutation createTaskImplementation ($task: TaskImplementationInput!) {
        createTaskImplementation (task: $task) {
            id
            name
            description
            category
            taskType
            isPublic
            author {
                id
            }
            plugin {
                id
                name
            }
        }
    }
`

export const CREATE_PLUGIN = gql`
    mutation createPlugin ($plugin: PluginInput!) {
        createPlugin (plugin: $plugin) {
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
            }
        }
    }
`

export const UPDATE_PLUGIN = gql`
    mutation updatePlugin ($plugin: PluginInput!) {
        updatePlugin (plugin: $plugin) {
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
            }
        }
    }
`

export const DELETE_PLUGIN = gql`
    mutation deletePlugin ($id: ID!) {
        deletePlugin (id: $id)
    }
`

export const VALIDATE_PLUGIN = gql`
    mutation validatePlugin ($id: ID!) {
        validatePlugin (id: $id)
    }
`

export const SOLVE_TASK_GRAPH = gql`
    mutation solveTaskGraph ($solution: SolutionGraphInput!) {
        solveTaskGraph (solution: $solution) {
            id
            isCorrect
            task {
                id
            }
            author {
                id
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
`

export const SOLVE_TASK_IMPLEMENTATION = gql`
    mutation solveTaskImplementation ($solution: SolutionImplementationInput!) {
        solveTaskImplementation (solution: $solution) {
            id
            isCorrect
            task {
                id
            }
            author {
                id
            }
            implementationResult {
                id
                originalTimeResult
                timeResult
                originalResult
                result
            }
        }
    }
`