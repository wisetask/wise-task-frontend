/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Color =
  | 'BLUE'
  | 'GRAY'
  | 'GREEN'
  | 'RED';

export type EdgeInput = {
  color: Color;
  label?: string | null | undefined;
  source: number;
  target: number;
  weight?: number | null | undefined;
};

export type GraphInput = {
  edgeCount: number;
  edgeList: Array<EdgeInput | null | undefined>;
  id?: string | number | null | undefined;
  isDirect: boolean;
  isNamed: boolean;
  name?: string | null | undefined;
  vertexCount: number;
  vertexList: Array<VertexInput | null | undefined>;
};

export type GraphType =
  | 'ANY'
  | 'DIRECT'
  | 'UNDIRECT';

export type PluginInfoInput = {
  mistakeText?: string | null | undefined;
  order: number;
  pluginId: string;
  pluginType: PluginType;
  sign?: string | null | undefined;
  value: string;
};

export type PluginType =
  | 'GRAPH_CHARACTERISTIC'
  | 'GRAPH_NEW_GRAPH'
  | 'GRAPH_PROPERTY'
  | 'GRAPH_STRING';

export type ProfileInput = {
  email: string;
  firstName: string;
  id?: string | number | null | undefined;
  lastName: string;
  patronymic?: string | null | undefined;
  profilePassword: string;
  profileRole?: Role | null | undefined;
};

export type Role =
  | 'ADMIN'
  | 'AUTHOR'
  | 'USER';

export type RuleInput = {
  isColor: boolean;
  isDelete: boolean;
  isEdit: boolean;
  isMove: boolean;
};

export type SignInRequest = {
  email: string;
  password: string;
};

export type SignUpRequest = {
  profile: ProfileInput;
};

export type TaskGraphInput = {
  authorId?: string | null | undefined;
  category: string;
  condition: Array<PluginInfoInput | null | undefined>;
  description: string;
  graph?: GraphInput | null | undefined;
  id?: string | number | null | undefined;
  isHiddenMistake: boolean;
  isPublic: boolean;
  name: string;
  rule: RuleInput;
  taskType: TaskType;
};

export type TaskType =
  | 'GRAPH'
  | 'IMPLEMENTATION'
  | 'UNRECOGNIZED';

export type VertexInput = {
  color: Color;
  id: number;
  label?: string | null | undefined;
  weight?: number | null | undefined;
  xCoordinate: number;
  yCoordinate: number;
};

export type MyProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProfileQuery = { getMyProfile: { id: string, email: string, firstName: string, lastName: string, patronymic: string | null, profileRole: Role } };

export type SignInMutationVariables = Exact<{
  request: SignInRequest;
}>;


export type SignInMutation = { signIn: { accessToken: string } };

export type SignUpMutationVariables = Exact<{
  request: SignUpRequest;
}>;


export type SignUpMutation = { signUp: { accessToken: string } };

export type GetTaskConditionPluginsQueryVariables = Exact<{
  page: number;
  pageSize: number;
}>;


export type GetTaskConditionPluginsQuery = { getAllPlugins: { items: Array<{ id: string, name: string, description: string, category: string, pluginType: PluginType, graphType: GraphType, isValid: boolean }> | null, pagination: { hasNext: boolean | null } | null } };

export type CreateTaskGraphMutationVariables = Exact<{
  task: TaskGraphInput;
}>;


export type CreateTaskGraphMutation = { createTaskGraph: { id: string, name: string } };


export const MyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMyProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"patronymic"}},{"kind":"Field","name":{"kind":"Name","value":"profileRole"}}]}}]}}]} as unknown as DocumentNode<MyProfileQuery, MyProfileQueryVariables>;
export const SignInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignInRequest"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"signInRequest"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<SignInMutation, SignInMutationVariables>;
export const SignUpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SignUp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"request"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignUpRequest"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signUp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"signUpRequest"},"value":{"kind":"Variable","name":{"kind":"Name","value":"request"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<SignUpMutation, SignUpMutationVariables>;
export const GetTaskConditionPluginsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTaskConditionPlugins"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllPlugins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"request"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isValid"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"pluginType"}},{"kind":"Field","name":{"kind":"Name","value":"graphType"}},{"kind":"Field","name":{"kind":"Name","value":"isValid"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNext"}}]}}]}}]}}]} as unknown as DocumentNode<GetTaskConditionPluginsQuery, GetTaskConditionPluginsQueryVariables>;
export const CreateTaskGraphDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTaskGraph"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"task"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskGraphInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTaskGraph"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"task"},"value":{"kind":"Variable","name":{"kind":"Name","value":"task"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateTaskGraphMutation, CreateTaskGraphMutationVariables>;