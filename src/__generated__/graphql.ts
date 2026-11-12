/* eslint-disable */
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
  createGraph: Graph;
  createPlugin?: Maybe<Plugin>;
  createTaskGraph: TaskGraph;
  createTaskImplementation: TaskImplementation;
  deleteGraph: Scalars['String']['output'];
  deletePlugin: Scalars['String']['output'];
  deleteProfile: Scalars['String']['output'];
  deleteTask: Scalars['String']['output'];
  generateGraph?: Maybe<Graph>;
  refreshToken: Token;
  resetPassword: Token;
  sendResetPasswordEmail: Scalars['String']['output'];
  signIn: Token;
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
  getStatistic: StatisticResponse;
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
