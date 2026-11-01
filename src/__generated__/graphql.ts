/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Long: { input: any; output: any; }
};

export enum AdditionPayloadType {
  Graph = 'GRAPH',
  String = 'STRING'
}

export type AdditionalPayload = {
  discriminator: AdditionPayloadType;
  handwrittenAnswer?: InputMaybe<Scalars['String']['input']>;
  otherGraph?: InputMaybe<GraphInput>;
};

export enum Color {
  Blue = 'BLUE',
  Gray = 'GRAY',
  Green = 'GREEN',
  Red = 'RED'
}

export type CreateGraphRequest = {
  graph: GraphInput;
};

export type Edge = {
  __typename?: 'Edge';
  color: Color;
  label: Scalars['String']['output'];
  source: Scalars['Int']['output'];
  target: Scalars['Int']['output'];
  weight: Scalars['Int']['output'];
};

export type EdgeInput = {
  color: Color;
  label?: InputMaybe<Scalars['String']['input']>;
  source: Scalars['Int']['input'];
  target: Scalars['Int']['input'];
  weight?: InputMaybe<Scalars['Int']['input']>;
};

export type GenerateGraphRequest = {
  edgeCount: Scalars['Int']['input'];
  isDirect: Scalars['Boolean']['input'];
  isSaved: Scalars['Boolean']['input'];
  vertexCount: Scalars['Int']['input'];
};

export type GetAllGraphsRequestInput = {
  filter?: InputMaybe<GraphFilterInput>;
  pagination?: InputMaybe<PaginationRequestInput>;
};

export type GetAllGraphsResponse = {
  __typename?: 'GetAllGraphsResponse';
  items?: Maybe<Array<Graph>>;
  pagination?: Maybe<PaginationResponse>;
};

export type GetAllPluginRequestInput = {
  filter?: InputMaybe<PluginFilterInput>;
  pagination?: InputMaybe<PaginationRequestInput>;
};

export type GetAllPluginsResponse = {
  __typename?: 'GetAllPluginsResponse';
  items?: Maybe<Array<Plugin>>;
  pagination?: Maybe<PaginationResponse>;
};

export type GetAllProfilesRequestInput = {
  filter?: InputMaybe<ProfileFilterInput>;
  pagination?: InputMaybe<PaginationRequestInput>;
};

export type GetAllProfilesResponse = {
  __typename?: 'GetAllProfilesResponse';
  items?: Maybe<Array<Profile>>;
  pagination?: Maybe<PaginationResponse>;
};

export type GetAllTaskRequestInput = {
  filter?: InputMaybe<TaskFilterInput>;
  pagination?: InputMaybe<PaginationRequestInput>;
};

export type GetAllTaskResponse = {
  __typename?: 'GetAllTaskResponse';
  items?: Maybe<Array<Task>>;
  pagination?: Maybe<PaginationResponse>;
};

export type GetAllTaskSolutionsRequestInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  isCorrect?: InputMaybe<Scalars['Boolean']['input']>;
  pagination?: InputMaybe<PaginationRequestInput>;
  taskId?: InputMaybe<Scalars['String']['input']>;
};

export type GetAllTaskSolutionsResponse = {
  __typename?: 'GetAllTaskSolutionsResponse';
  items?: Maybe<Array<Solution>>;
  pagination?: Maybe<PaginationResponse>;
};

export type Graph = {
  __typename?: 'Graph';
  author?: Maybe<Profile>;
  edgeCount: Scalars['Int']['output'];
  edgeList: Array<Maybe<Edge>>;
  id: Scalars['String']['output'];
  isDirect: Scalars['Boolean']['output'];
  isNamed: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
  vertexCount: Scalars['Int']['output'];
  vertexList: Array<Maybe<Vertex>>;
};

export type GraphFilterInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  edgeCount?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  isDirect?: InputMaybe<Scalars['Boolean']['input']>;
  isNamed?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  vertexCount?: InputMaybe<Scalars['Int']['input']>;
};

export type GraphInput = {
  edgeCount: Scalars['Int']['input'];
  edgeList: Array<InputMaybe<EdgeInput>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isDirect: Scalars['Boolean']['input'];
  isNamed: Scalars['Boolean']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  vertexCount: Scalars['Int']['input'];
  vertexList: Array<InputMaybe<VertexInput>>;
};

export type GraphResult = {
  __typename?: 'GraphResult';
  id: Scalars['String']['output'];
  originalResult: Scalars['String']['output'];
  originalTimeResult: Scalars['Float']['output'];
  result: Scalars['String']['output'];
  timeResult: Scalars['Float']['output'];
};

export type GraphTestResult = {
  __typename?: 'GraphTestResult';
  graph?: Maybe<Graph>;
  originalResult: Scalars['String']['output'];
  originalTimeResult: Scalars['Int']['output'];
  result: Scalars['String']['output'];
  timeResult: Scalars['Int']['output'];
};

export enum GraphType {
  Any = 'ANY',
  Direct = 'DIRECT',
  Undirect = 'UNDIRECT'
}

export type ImplementationResult = {
  __typename?: 'ImplementationResult';
  graphTestResults: Array<Maybe<GraphTestResult>>;
  result: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  changePassword: Scalars['String']['output'];
  checkPluginImplementation: ImplementationResult;
  checkPluginSolution: Scalars['String']['output'];
  /** graph */
  createGraph: Graph;
  /** plugin */
  createPlugin?: Maybe<Plugin>;
  createTaskGraph: TaskGraph;
  createTaskImplementation: TaskImplementation;
  deleteGraph: Scalars['String']['output'];
  deletePlugin: Scalars['String']['output'];
  deleteProfile: Scalars['String']['output'];
  /** task */
  deleteTask: Scalars['String']['output'];
  generateGraph?: Maybe<Graph>;
  refreshToken: Token;
  resetPassword: Token;
  sendResetPasswordEmail: Scalars['String']['output'];
  signIn: Token;
  /** profile */
  signUp: Token;
  solveTaskGraph: SolutionGraph;
  solveTaskImplementation: SolutionImplementation;
  updatePlugin?: Maybe<Plugin>;
  updateProfile: Profile;
  updateTaskGraph: TaskGraph;
  updateTaskImplementation: TaskImplementation;
  validatePlugin: Scalars['String']['output'];
};


export type MutationChangePasswordArgs = {
  id: Scalars['ID']['input'];
  newPassword: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
};


export type MutationCheckPluginImplementationArgs = {
  file: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationCheckPluginSolutionArgs = {
  solution: SolutionInput;
};


export type MutationCreateGraphArgs = {
  graph: GraphInput;
};


export type MutationCreatePluginArgs = {
  plugin: PluginInput;
};


export type MutationCreateTaskGraphArgs = {
  task: TaskGraphInput;
};


export type MutationCreateTaskImplementationArgs = {
  task: TaskImplementationInput;
};


export type MutationDeleteGraphArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePluginArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProfileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateGraphArgs = {
  generateGraphRequest: GenerateGraphRequest;
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  resetPasswordRequest: ResetPasswordRequest;
};


export type MutationSendResetPasswordEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationSignInArgs = {
  signInRequest: SignInRequest;
};


export type MutationSignUpArgs = {
  signUpRequest: SignUpRequest;
};


export type MutationSolveTaskGraphArgs = {
  solution: SolutionGraphInput;
};


export type MutationSolveTaskImplementationArgs = {
  solution: SolutionImplementationInput;
};


export type MutationUpdatePluginArgs = {
  plugin: PluginInput;
};


export type MutationUpdateProfileArgs = {
  profile?: InputMaybe<ProfileInput>;
};


export type MutationUpdateTaskGraphArgs = {
  task: TaskGraphInput;
};


export type MutationUpdateTaskImplementationArgs = {
  task: TaskImplementationInput;
};


export type MutationValidatePluginArgs = {
  id: Scalars['ID']['input'];
};

export type PaginationRequestInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type PaginationResponse = {
  __typename?: 'PaginationResponse';
  hasNext?: Maybe<Scalars['Boolean']['output']>;
  hasPrevious?: Maybe<Scalars['Boolean']['output']>;
  page?: Maybe<Scalars['Int']['output']>;
  pageSize?: Maybe<Scalars['Int']['output']>;
  totalCount?: Maybe<Scalars['Long']['output']>;
  totalPages?: Maybe<Scalars['Int']['output']>;
};

export type Payload = {
  discriminator: PayloadType;
  graph?: InputMaybe<GraphInput>;
};

export enum PayloadType {
  Graph = 'GRAPH'
}

export type Plugin = {
  __typename?: 'Plugin';
  author?: Maybe<Profile>;
  beanName?: Maybe<Scalars['String']['output']>;
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  graphType: GraphType;
  id: Scalars['ID']['output'];
  isInternal: Scalars['Boolean']['output'];
  isValid: Scalars['Boolean']['output'];
  jarFile?: Maybe<Scalars['String']['output']>;
  jarName?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  pluginType: PluginType;
};

export type PluginFilterInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  graphType?: InputMaybe<GraphType>;
  isInternal?: InputMaybe<Scalars['Boolean']['input']>;
  isValid?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pluginType?: InputMaybe<PluginType>;
};

export type PluginInfo = {
  __typename?: 'PluginInfo';
  mistakeText?: Maybe<Scalars['String']['output']>;
  plugin?: Maybe<Plugin>;
  pluginType: PluginType;
  sign?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

export type PluginInfoInput = {
  mistakeText?: InputMaybe<Scalars['String']['input']>;
  order: Scalars['Int']['input'];
  pluginId: Scalars['String']['input'];
  pluginType: PluginType;
  sign?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

export type PluginInput = {
  authorId?: InputMaybe<Scalars['ID']['input']>;
  beanName?: InputMaybe<Scalars['String']['input']>;
  category: Scalars['String']['input'];
  description: Scalars['String']['input'];
  graphType: GraphType;
  id?: InputMaybe<Scalars['ID']['input']>;
  isInternal: Scalars['Boolean']['input'];
  isValid: Scalars['Boolean']['input'];
  jarFile?: InputMaybe<Scalars['String']['input']>;
  jarName?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  pluginType: PluginType;
};

export type PluginResult = {
  __typename?: 'PluginResult';
  isCorrect: Scalars['Boolean']['output'];
  plugin?: Maybe<Plugin>;
  pluginMessage: Scalars['String']['output'];
  trueValue: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/**  --------------------------------------------------------------------------------- */
export type PluginStringInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export enum PluginType {
  GraphCharacteristic = 'GRAPH_CHARACTERISTIC',
  GraphNewGraph = 'GRAPH_NEW_GRAPH',
  GraphProperty = 'GRAPH_PROPERTY',
  GraphString = 'GRAPH_STRING'
}

export type Profile = {
  __typename?: 'Profile';
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  patronymic?: Maybe<Scalars['String']['output']>;
  profilePassword: Scalars['String']['output'];
  profileRole: Role;
};

export type ProfileFilterInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  patronymic?: InputMaybe<Scalars['String']['input']>;
  profileRole?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ProfileInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  lastName: Scalars['String']['input'];
  patronymic?: InputMaybe<Scalars['String']['input']>;
  profilePassword: Scalars['String']['input'];
  profileRole?: InputMaybe<Role>;
};

export type Query = {
  __typename?: 'Query';
  getAllGraphs: GetAllGraphsResponse;
  getAllPlugins: GetAllPluginsResponse;
  getAllProfiles: GetAllProfilesResponse;
  getAllTaskSolutions: GetAllTaskSolutionsResponse;
  getAllTasks: GetAllTaskResponse;
  getGraphById: Graph;
  getMyProfile: Profile;
  getPlugin: Plugin;
  getProfile: Profile;
  /** event */
  getStatistic: StatisticResponse;
  /** task */
  getTask: Task;
  getTaskSolution: Solution;
};


export type QueryGetAllGraphsArgs = {
  request: GetAllGraphsRequestInput;
};


export type QueryGetAllPluginsArgs = {
  request: GetAllPluginRequestInput;
};


export type QueryGetAllProfilesArgs = {
  request: GetAllProfilesRequestInput;
};


export type QueryGetAllTaskSolutionsArgs = {
  request: GetAllTaskSolutionsRequestInput;
};


export type QueryGetAllTasksArgs = {
  request: GetAllTaskRequestInput;
};


export type QueryGetGraphByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetPluginArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetProfileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetStatisticArgs = {
  request: StatisticRequestInput;
};


export type QueryGetTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetTaskSolutionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserSolutionStatisticArgs = {
  userId: Scalars['ID']['input'];
};

export type ResetPasswordRequest = {
  newPassword: Scalars['String']['input'];
  recoveryToken: Scalars['String']['input'];
};

export enum Role {
  Admin = 'ADMIN',
  Author = 'AUTHOR',
  User = 'USER'
}

export type Rule = {
  __typename?: 'Rule';
  isColor: Scalars['Boolean']['output'];
  isDelete: Scalars['Boolean']['output'];
  isEdit: Scalars['Boolean']['output'];
  isMove: Scalars['Boolean']['output'];
};

export type RuleInput = {
  isColor: Scalars['Boolean']['input'];
  isDelete: Scalars['Boolean']['input'];
  isEdit: Scalars['Boolean']['input'];
  isMove: Scalars['Boolean']['input'];
};

export type SignInRequest = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type SignUpRequest = {
  profile: ProfileInput;
};

/**  --------------------------------------------------------------------------------- */
export type Solution = {
  author?: Maybe<Profile>;
  id: Scalars['ID']['output'];
  isCorrect: Scalars['Boolean']['output'];
  task?: Maybe<Task>;
};

export type SolutionGraph = Solution & {
  __typename?: 'SolutionGraph';
  author?: Maybe<Profile>;
  graph: Graph;
  id: Scalars['ID']['output'];
  isCorrect: Scalars['Boolean']['output'];
  pluginResults?: Maybe<Array<PluginResult>>;
  task?: Maybe<Task>;
};

export type SolutionGraphInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  graph: GraphInput;
  id?: InputMaybe<Scalars['ID']['input']>;
  pluginsInput?: InputMaybe<Array<PluginStringInput>>;
  taskId: Scalars['String']['input'];
};

export type SolutionImplementation = Solution & {
  __typename?: 'SolutionImplementation';
  author?: Maybe<Profile>;
  id: Scalars['ID']['output'];
  implementationResult?: Maybe<Array<GraphResult>>;
  isCorrect: Scalars['Boolean']['output'];
  task?: Maybe<Task>;
};

export type SolutionImplementationInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  taskId: Scalars['String']['input'];
};

export type SolutionInput = {
  additionalPayload?: InputMaybe<AdditionalPayload>;
  payload: Payload;
  pluginId: Scalars['ID']['input'];
  pluginType: PluginType;
};

export type StatisticRequestInput = {
  event_type?: InputMaybe<Scalars['String']['input']>;
  scope: StatisticScope;
  task_id?: InputMaybe<Scalars['ID']['input']>;
  type: StatisticType;
  user_id?: InputMaybe<Scalars['ID']['input']>;
};

export type StatisticResponse = {
  __typename?: 'StatisticResponse';
  event_type?: Maybe<Scalars['String']['output']>;
  scope: StatisticScope;
  task_id?: Maybe<Scalars['String']['output']>;
  type: StatisticType;
  updated_at: Scalars['String']['output'];
  user_id?: Maybe<Scalars['String']['output']>;
  value: Scalars['Float']['output'];
};

export enum StatisticScope {
  Global = 'GLOBAL',
  Session = 'SESSION',
  Task = 'TASK',
  User = 'USER'
}

export enum StatisticType {
  Mean = 'MEAN',
  SuccessRate = 'SUCCESS_RATE',
  Sum = 'SUM'
}

/**  ------------------------------------------------------------------------- */
export type Task = {
  author?: Maybe<Profile>;
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  taskType: TaskType;
};

export type TaskFilterInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  taskType?: InputMaybe<TaskType>;
};

export type TaskGraph = Task & {
  __typename?: 'TaskGraph';
  author?: Maybe<Profile>;
  category: Scalars['String']['output'];
  conditions?: Maybe<Array<PluginInfo>>;
  description: Scalars['String']['output'];
  graph?: Maybe<Graph>;
  id: Scalars['ID']['output'];
  isHiddenMistake: Scalars['Boolean']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  rule: Rule;
  taskType: TaskType;
};

export type TaskGraphInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  category: Scalars['String']['input'];
  condition: Array<InputMaybe<PluginInfoInput>>;
  description: Scalars['String']['input'];
  graph?: InputMaybe<GraphInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isHiddenMistake: Scalars['Boolean']['input'];
  isPublic: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  rule: RuleInput;
  taskType: TaskType;
};

export type TaskImplementation = Task & {
  __typename?: 'TaskImplementation';
  author?: Maybe<Profile>;
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  plugin?: Maybe<Plugin>;
  taskType: TaskType;
};

export type TaskImplementationInput = {
  authorId?: InputMaybe<Scalars['String']['input']>;
  category: Scalars['String']['input'];
  description: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  isPublic: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  pluginId: Scalars['String']['input'];
  taskType: TaskType;
};

export enum TaskType {
  Graph = 'GRAPH',
  Implementation = 'IMPLEMENTATION',
  Unrecognized = 'UNRECOGNIZED'
}

export type Token = {
  __typename?: 'Token';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
};

export type Vertex = {
  __typename?: 'Vertex';
  color: Color;
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  weight: Scalars['Int']['output'];
  xCoordinate: Scalars['Int']['output'];
  yCoordinate: Scalars['Int']['output'];
};

export type VertexInput = {
  color: Color;
  id: Scalars['Int']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  weight?: InputMaybe<Scalars['Int']['input']>;
  xCoordinate: Scalars['Int']['input'];
  yCoordinate: Scalars['Int']['input'];
};

export type SignInMutationVariables = Exact<{
  signInRequest: SignInRequest;
}>;
export type SignInMutation = { __typename?: 'Mutation', signIn: { __typename?: 'Token', accessToken: string, refreshToken: string } };
export type SignUpMutationVariables = Exact<{
  signUpRequest: SignUpRequest;
}>;
export type SignUpMutation = { __typename?: 'Mutation', signUp: { __typename?: 'Token', accessToken: string, refreshToken: string } };
export type UpdateProfileMutationVariables = Exact<{
  profile: ProfileInput;
}>;
export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'Profile', id: string, email: string, profilePassword: string, firstName: string, lastName: string, patronymic?: string | null, profileRole: Role } };
export type DeleteProfileMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>
export type DeleteProfileMutation = { __typename?: 'Mutation', deleteProfile: string };
export type CreateGraphMutationVariables = Exact<{
  graph: GraphInput;
}>;
export type CreateGraphMutation = { __typename?: 'Mutation', createGraph: { __typename?: 'Graph', id: string, vertexCount: number, edgeCount: number, isDirect: boolean, isNamed: boolean, name?: string | null, vertexList: Array<{ __typename?: 'Vertex', id: number, weight: number, label: string, xCoordinate: number, yCoordinate: number, color: Color } | null>, edgeList: Array<{ __typename?: 'Edge', source: number, target: number, weight: number, label: string, color: Color } | null> } };
export type DeleteGraphMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type DeleteGraphMutation = { __typename?: 'Mutation', deleteGraph: string };
export type CreateTaskGraphMutationVariables = Exact<{
  task: TaskGraphInput;
}>;
export type CreateTaskGraphMutation = { __typename?: 'Mutation', createTaskGraph: { __typename?: 'TaskGraph', id: string, name: string, description: string, category: string, taskType: TaskType, isPublic: boolean, isHiddenMistake: boolean, rule: { __typename?: 'Rule', isColor: boolean, isEdit: boolean, isMove: boolean, isDelete: boolean }, author?: { __typename?: 'Profile', id: string } | null, conditions?: Array<{ __typename?: 'PluginInfo', value: string, mistakeText?: string | null, sign?: string | null, pluginType: PluginType, plugin?: { __typename?: 'Plugin', id: string } | null }> | null } };
export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: string };
export type CreateTaskImplementationMutationVariables = Exact<{
  task: TaskImplementationInput;
}>;
export type CreateTaskImplementationMutation = { __typename?: 'Mutation', createTaskImplementation: { __typename?: 'TaskImplementation', id: string, name: string, description: string, category: string, taskType: TaskType, isPublic: boolean, author?: { __typename?: 'Profile', id: string } | null, plugin?: { __typename?: 'Plugin', id: string } | null } };
export type CreatePluginMutationVariables = Exact<{
  plugin: PluginInput;
}>;
export type CreatePluginMutation = { __typename?: 'Mutation', createPlugin?: { __typename?: 'Plugin', id: string, name: string, description: string, category: string, graphType: GraphType, isValid: boolean, beanName?: string | null, pluginType: PluginType, isInternal: boolean, author?: { __typename?: 'Profile', id: string } | null } | null };
export type UpdatePluginMutationVariables = Exact<{
  plugin: PluginInput;
}>;
export type UpdatePluginMutation = { __typename?: 'Mutation', updatePlugin?: { __typename?: 'Plugin', id: string, name: string, description: string, category: string, graphType: GraphType, isValid: boolean, beanName?: string | null, pluginType: PluginType, isInternal: boolean, author?: { __typename?: 'Profile', id: string } | null } | null };
export type DeletePluginMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type DeletePluginMutation = { __typename?: 'Mutation', deletePlugin: string };
export type ValidatePluginMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type ValidatePluginMutation = { __typename?: 'Mutation', validatePlugin: string };
export type SolveTaskGraphMutationVariables = Exact<{
  solution: SolutionGraphInput;
}>;
export type SolveTaskGraphMutation = { __typename?: 'Mutation', solveTaskGraph: { __typename?: 'SolutionGraph', id: string, isCorrect: boolean, task?: { __typename?: 'TaskGraph', id: string } | { __typename?: 'TaskImplementation', id: string } | null, author?: { __typename?: 'Profile', id: string } | null, pluginResults?: Array<{ __typename?: 'PluginResult', isCorrect: boolean, value: string, trueValue: string, plugin?: { __typename?: 'Plugin', id: string } | null }> | null } };
export type SolveTaskImplementationMutationVariables = Exact<{
  solution: SolutionImplementationInput;
}>;
export type SolveTaskImplementationMutation = { __typename?: 'Mutation', solveTaskImplementation: { __typename?: 'SolutionImplementation', id: string, isCorrect: boolean, task?: { __typename?: 'TaskGraph', id: string } | { __typename?: 'TaskImplementation', id: string } | null, author?: { __typename?: 'Profile', id: string } | null, implementationResult?: Array<{ __typename?: 'GraphResult', id: string, originalTimeResult: number, timeResult: number, originalResult: string, result: string }> | null } };
export type GetAllProfilesQueryVariables = Exact<{ [key: string]: never; }>;
export type GetAllProfilesQuery = { __typename?: 'Query', getAllProfiles: { __typename?: 'GetAllProfilesResponse', items?: Array<{ __typename?: 'Profile', id: string, email: string, firstName: string, lastName: string, patronymic?: string | null, profileRole: Role }> | null } };
export type GetProfileQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type GetProfileQuery = { __typename?: 'Query', getProfile: { __typename?: 'Profile', id: string, email: string, profilePassword: string, firstName: string, lastName: string, patronymic?: string | null, profileRole: Role } };
export type GetTaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type GetTaskQuery = { __typename?: 'Query', getTask: { __typename: 'TaskGraph', isHiddenMistake: boolean, id: string, name: string, description: string, category: string, taskType: TaskType, isPublic: boolean, graph?: { __typename?: 'Graph', id: string, vertexCount: number, edgeCount: number, isDirect: boolean, vertexList: Array<{ __typename?: 'Vertex', id: number, weight: number, label: string, xCoordinate: number, yCoordinate: number, color: Color } | null>, edgeList: Array<{ __typename?: 'Edge', source: number, target: number, weight: number, label: string, color: Color } | null> } | null, conditions?: Array<{ __typename?: 'PluginInfo', mistakeText?: string | null, plugin?: { __typename?: 'Plugin', id: string } | null }> | null, author?: { __typename?: 'Profile', id: string } | null } | { __typename: 'TaskImplementation', id: string, name: string, description: string, category: string, taskType: TaskType, isPublic: boolean, plugin?: { __typename?: 'Plugin', id: string } | null, author?: { __typename?: 'Profile', id: string } | null } };
export type GetGraphByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;
export type GetGraphByIdQuery = { __typename?: 'Query', getGraphById: { __typename?: 'Graph', id: string, isDirect: boolean, isNamed: boolean, name?: string | null, vertexCount: number, edgeCount: number, vertexList: Array<{ __typename?: 'Vertex', id: number, label: string, color: Color, weight: number, xCoordinate: number, yCoordinate: number } | null>, edgeList: Array<{ __typename?: 'Edge', source: number, target: number, label: string, color: Color, weight: number } | null> } };
export type GetUserSolutionStatisticQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['String']['input']>;
}>;
export type GetUserSolutionStatisticQuery = { __typename?: 'Query', getAllTaskSolutions: { __typename?: 'GetAllTaskSolutionsResponse', items?: Array<{ __typename: 'SolutionGraph', id: string, isCorrect: boolean, task?: { __typename?: 'TaskGraph', id: string } | { __typename?: 'TaskImplementation', id: string } | null, author?: { __typename?: 'Profile', id: string } | null } | { __typename: 'SolutionImplementation', id: string, isCorrect: boolean, task?: { __typename?: 'TaskGraph', id: string } | { __typename?: 'TaskImplementation', id: string } | null, author?: { __typename?: 'Profile', id: string } | null }> | null } };
export type GetSolutionWithTaskDescriptionQueryVariables = Exact<{
  taskId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
}>;
export type GetSolutionWithTaskDescriptionQuery = { __typename?: 'Query', getTaskSolution: { __typename: 'SolutionGraph', id: string, isCorrect: boolean, graph: { __typename?: 'Graph', id: string, vertexCount: number, edgeCount: number, isDirect: boolean, vertexList: Array<{ __typename?: 'Vertex', id: number, weight: number, label: string, xCoordinate: number, yCoordinate: number, color: Color } | null>, edgeList: Array<{ __typename?: 'Edge', source: number, target: number, weight: number, label: string, color: Color } | null> }, pluginResults?: Array<{ __typename?: 'PluginResult', isCorrect: boolean, value: string, trueValue: string, pluginMessage: string, plugin?: { __typename?: 'Plugin', id: string } | null }> | null, task?: { __typename?: 'TaskGraph', id: string } | { __typename?: 'TaskImplementation', id: string } | null, author?: { __typename?: 'Profile', id: string } | null } | { __typename: 'SolutionImplementation', id: string, isCorrect: boolean, task?: { __typename?: 'TaskGraph', id: string } | { __typename?: 'TaskImplementation', id: string } | null, author?: { __typename?: 'Profile', id: string } | null }, getTask: { __typename?: 'TaskGraph', description: string } | { __typename?: 'TaskImplementation', description: string } };
export type GetGraphLibraryQueryVariables = Exact<{ [key: string]: never; }>;
export type GetGraphLibraryQuery = { __typename?: 'Query', getAllGraphs: { __typename?: 'GetAllGraphsResponse', items?: Array<{ __typename?: 'Graph', id: string, name?: string | null, isNamed: boolean, vertexList: Array<{ __typename?: 'Vertex', id: number, label: string } | null>, edgeList: Array<{ __typename?: 'Edge', label: string } | null> }> | null } };
export type GetAllPluginsQueryVariables = Exact<{ [key: string]: never; }>;
export type GetAllPluginsQuery = { __typename?: 'Query', getAllPlugins: { __typename?: 'GetAllPluginsResponse', items?: Array<{ __typename?: 'Plugin', id: string, name: string, description: string, category: string, graphType: GraphType, isValid: boolean, beanName?: string | null, pluginType: PluginType, isInternal: boolean, author?: { __typename?: 'Profile', id: string } | null }> | null } };
export type GetAllTasksQueryVariables = Exact<{ [key: string]: never; }>;
export type GetAllTasksQuery = { __typename?: 'Query', getAllTasks: { __typename?: 'GetAllTaskResponse', items?: Array<{ __typename?: 'TaskGraph', id: string, name: string, description: string, category: string, taskType: TaskType, isPublic: boolean, author?: { __typename?: 'Profile', id: string } | null } | { __typename?: 'TaskImplementation', id: string, name: string, description: string, category: string, taskType: TaskType, isPublic: boolean, author?: { __typename?: 'Profile', id: string } | null }> | null } };
export type GetStatisticQueryVariables = Exact<{
  request: StatisticRequestInput;
}>;

export type GetStatisticQuery = { __typename?: 'Query', getStatistic: { __typename?: 'StatisticResponse', scope: StatisticScope, type: StatisticType, updated_at: string, task_id?: string | null, user_id?: string | null, value: number, event_type?: string | null } };
export type GetMyProfileQueryVariables = Exact<{ [key: string]: never; }>;
export type GetMyProfileQuery = { __typename?: 'Query', getMyProfile: { __typename?: 'Profile', id: string, email: string, firstName: string, lastName: string, patronymic?: string | null, profileRole: Role } };


export const SignInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"signIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"signInRequest"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignInRequest"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"signInRequest"},"value":{"kind":"Variable","name":{"kind":"Name","value":"signInRequest"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<SignInMutation, SignInMutationVariables>;
export const SignUpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"signUp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"signUpRequest"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignUpRequest"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signUp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"signUpRequest"},"value":{"kind":"Variable","name":{"kind":"Name","value":"signUpRequest"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}}]}}]} as unknown as DocumentNode<SignUpMutation, SignUpMutationVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"profile"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"profile"},"value":{"kind":"Variable","name":{"kind":"Name","value":"profile"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"profilePassword"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"patronymic"}},{"kind":"Field","name":{"kind":"Name","value":"profileRole"}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const DeleteProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProfileMutation, DeleteProfileMutationVariables>;
export const CreateGraphDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createGraph"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"graph"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GraphInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGraph"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"graph"},"value":{"kind":"Variable","name":{"kind":"Name","value":"graph"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexCount"}},{"kind":"Field","name":{"kind":"Name","value":"edgeCount"}},{"kind":"Field","name":{"kind":"Name","value":"isDirect"}},{"kind":"Field","name":{"kind":"Name","value":"vertexList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"xCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"yCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edgeList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isNamed"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateGraphMutation, CreateGraphMutationVariables>;
export const DeleteGraphDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteGraph"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGraph"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGraphMutation, DeleteGraphMutationVariables>;
export const CreateTaskGraphDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTaskGraph"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"task"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskGraphInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTaskGraph"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"task"},"value":{"kind":"Variable","name":{"kind":"Name","value":"task"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"taskType"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isHiddenMistake"}},{"kind":"Field","name":{"kind":"Name","value":"rule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isColor"}},{"kind":"Field","name":{"kind":"Name","value":"isEdit"}},{"kind":"Field","name":{"kind":"Name","value":"isMove"}},{"kind":"Field","name":{"kind":"Name","value":"isDelete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plugin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"mistakeText"}},{"kind":"Field","name":{"kind":"Name","value":"sign"}},{"kind":"Field","name":{"kind":"Name","value":"pluginType"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTaskGraphMutation, CreateTaskGraphMutationVariables>;
export const DeleteTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CreateTaskImplementationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTaskImplementation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"task"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskImplementationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTaskImplementation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"task"},"value":{"kind":"Variable","name":{"kind":"Name","value":"task"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"taskType"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"plugin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTaskImplementationMutation, CreateTaskImplementationMutationVariables>;
export const CreatePluginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createPlugin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plugin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PluginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPlugin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"plugin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plugin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"graphType"}},{"kind":"Field","name":{"kind":"Name","value":"isValid"}},{"kind":"Field","name":{"kind":"Name","value":"beanName"}},{"kind":"Field","name":{"kind":"Name","value":"pluginType"}},{"kind":"Field","name":{"kind":"Name","value":"isInternal"}}]}}]}}]} as unknown as DocumentNode<CreatePluginMutation, CreatePluginMutationVariables>;
export const UpdatePluginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updatePlugin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plugin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PluginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePlugin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"plugin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plugin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"graphType"}},{"kind":"Field","name":{"kind":"Name","value":"isValid"}},{"kind":"Field","name":{"kind":"Name","value":"beanName"}},{"kind":"Field","name":{"kind":"Name","value":"pluginType"}},{"kind":"Field","name":{"kind":"Name","value":"isInternal"}}]}}]}}]} as unknown as DocumentNode<UpdatePluginMutation, UpdatePluginMutationVariables>;
export const DeletePluginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deletePlugin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePlugin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePluginMutation, DeletePluginMutationVariables>;
export const ValidatePluginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"validatePlugin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validatePlugin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ValidatePluginMutation, ValidatePluginMutationVariables>;
export const SolveTaskGraphDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"solveTaskGraph"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"solution"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SolutionGraphInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"solveTaskGraph"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"solution"},"value":{"kind":"Variable","name":{"kind":"Name","value":"solution"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}},{"kind":"Field","name":{"kind":"Name","value":"pluginResults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plugin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"trueValue"}}]}}]}}]}}]} as unknown as DocumentNode<SolveTaskGraphMutation, SolveTaskGraphMutationVariables>;
export const SolveTaskImplementationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"solveTaskImplementation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"solution"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SolutionImplementationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"solveTaskImplementation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"solution"},"value":{"kind":"Variable","name":{"kind":"Name","value":"solution"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}},{"kind":"Field","name":{"kind":"Name","value":"implementationResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"originalTimeResult"}},{"kind":"Field","name":{"kind":"Name","value":"timeResult"}},{"kind":"Field","name":{"kind":"Name","value":"originalResult"}},{"kind":"Field","name":{"kind":"Name","value":"result"}}]}}]}}]}}]} as unknown as DocumentNode<SolveTaskImplementationMutation, SolveTaskImplementationMutationVariables>;
export const GetAllProfilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllProfiles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"patronymic"}},{"kind":"Field","name":{"kind":"Name","value":"profileRole"}}]}}]}}]}}]} as unknown as DocumentNode<GetAllProfilesQuery, GetAllProfilesQueryVariables>;
export const GetProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"profilePassword"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"patronymic"}},{"kind":"Field","name":{"kind":"Name","value":"profileRole"}}]}}]}}]} as unknown as DocumentNode<GetProfileQuery, GetProfileQueryVariables>;
export const GetTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"taskType"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TaskGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isHiddenMistake"}},{"kind":"Field","name":{"kind":"Name","value":"graph"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexCount"}},{"kind":"Field","name":{"kind":"Name","value":"edgeCount"}},{"kind":"Field","name":{"kind":"Name","value":"isDirect"}},{"kind":"Field","name":{"kind":"Name","value":"vertexList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"xCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"yCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edgeList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plugin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mistakeText"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TaskImplementation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plugin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTaskQuery, GetTaskQueryVariables>;
export const GetGraphByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGraphById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getGraphById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isDirect"}},{"kind":"Field","name":{"kind":"Name","value":"isNamed"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"vertexCount"}},{"kind":"Field","name":{"kind":"Name","value":"edgeCount"}},{"kind":"Field","name":{"kind":"Name","value":"vertexList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"xCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"yCoordinate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edgeList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}}]}}]}}]}}]} as unknown as DocumentNode<GetGraphByIdQuery, GetGraphByIdQueryVariables>;
export const GetUserSolutionStatisticDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserSolutionStatistic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllTaskSolutions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"authorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserSolutionStatisticQuery, GetUserSolutionStatisticQueryVariables>;
export const GetSolutionWithTaskDescriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getSolutionWithTaskDescription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"solutionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTaskSolution"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"solutionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"task"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SolutionGraph"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"graph"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"vertexCount"}},{"kind":"Field","name":{"kind":"Name","value":"edgeCount"}},{"kind":"Field","name":{"kind":"Name","value":"isDirect"}},{"kind":"Field","name":{"kind":"Name","value":"vertexList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"xCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"yCoordinate"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edgeList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pluginResults"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plugin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"trueValue"}},{"kind":"Field","name":{"kind":"Name","value":"pluginMessage"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"getTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<GetSolutionWithTaskDescriptionQuery, GetSolutionWithTaskDescriptionQueryVariables>;
export const GetGraphLibraryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGraphLibrary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllGraphs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isNamed"}},{"kind":"Field","name":{"kind":"Name","value":"vertexList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edgeList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetGraphLibraryQuery, GetGraphLibraryQueryVariables>;
export const GetAllPluginsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllPlugins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllPlugins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"graphType"}},{"kind":"Field","name":{"kind":"Name","value":"isValid"}},{"kind":"Field","name":{"kind":"Name","value":"beanName"}},{"kind":"Field","name":{"kind":"Name","value":"pluginType"}},{"kind":"Field","name":{"kind":"Name","value":"isInternal"}}]}}]}}]}}]} as unknown as DocumentNode<GetAllPluginsQuery, GetAllPluginsQueryVariables>;
export const GetAllTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllTasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"taskType"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}}]}}]}}]}}]} as unknown as DocumentNode<GetAllTasksQuery, GetAllTasksQueryVariables>;
export const GetStatisticDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStatistic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StatisticRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getStatistic"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"task_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"event_type"}}]}}]}}]} as unknown as DocumentNode<GetStatisticQuery, GetStatisticQueryVariables>;
export const GetMyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMyProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"patronymic"}},{"kind":"Field","name":{"kind":"Name","value":"profileRole"}}]}}]}}]} as unknown as DocumentNode<GetMyProfileQuery, GetMyProfileQueryVariables>;