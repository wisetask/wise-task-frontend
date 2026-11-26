/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query MyProfile {\n    getMyProfile {\n      id\n      email\n      firstName\n      lastName\n      patronymic\n      profileRole\n    }\n  }\n": typeof types.MyProfileDocument,
    "\n  mutation SignIn($request: SignInRequest!) {\n    signIn(signInRequest: $request) {\n      accessToken\n    }\n  }\n": typeof types.SignInDocument,
    "\n  mutation SignUp($request: SignUpRequest!) {\n    signUp(signUpRequest: $request) {\n      accessToken\n    }\n  }\n": typeof types.SignUpDocument,
    "\n  query GetTaskConditionPlugins($page: Int!, $pageSize: Int!) {\n    getAllPlugins(\n      request: { filter: { isValid: true }, pagination: { page: $page, pageSize: $pageSize } }\n    ) {\n      items {\n        id\n        name\n        description\n        category\n        pluginType\n        graphType\n        isValid\n      }\n      pagination {\n        hasNext\n      }\n    }\n  }\n": typeof types.GetTaskConditionPluginsDocument,
    "\n  mutation CreateTaskGraph($task: TaskGraphInput!) {\n    createTaskGraph(task: $task) {\n      id\n      name\n    }\n  }\n": typeof types.CreateTaskGraphDocument,
};
const documents: Documents = {
    "\n  query MyProfile {\n    getMyProfile {\n      id\n      email\n      firstName\n      lastName\n      patronymic\n      profileRole\n    }\n  }\n": types.MyProfileDocument,
    "\n  mutation SignIn($request: SignInRequest!) {\n    signIn(signInRequest: $request) {\n      accessToken\n    }\n  }\n": types.SignInDocument,
    "\n  mutation SignUp($request: SignUpRequest!) {\n    signUp(signUpRequest: $request) {\n      accessToken\n    }\n  }\n": types.SignUpDocument,
    "\n  query GetTaskConditionPlugins($page: Int!, $pageSize: Int!) {\n    getAllPlugins(\n      request: { filter: { isValid: true }, pagination: { page: $page, pageSize: $pageSize } }\n    ) {\n      items {\n        id\n        name\n        description\n        category\n        pluginType\n        graphType\n        isValid\n      }\n      pagination {\n        hasNext\n      }\n    }\n  }\n": types.GetTaskConditionPluginsDocument,
    "\n  mutation CreateTaskGraph($task: TaskGraphInput!) {\n    createTaskGraph(task: $task) {\n      id\n      name\n    }\n  }\n": types.CreateTaskGraphDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyProfile {\n    getMyProfile {\n      id\n      email\n      firstName\n      lastName\n      patronymic\n      profileRole\n    }\n  }\n"): (typeof documents)["\n  query MyProfile {\n    getMyProfile {\n      id\n      email\n      firstName\n      lastName\n      patronymic\n      profileRole\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignIn($request: SignInRequest!) {\n    signIn(signInRequest: $request) {\n      accessToken\n    }\n  }\n"): (typeof documents)["\n  mutation SignIn($request: SignInRequest!) {\n    signIn(signInRequest: $request) {\n      accessToken\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignUp($request: SignUpRequest!) {\n    signUp(signUpRequest: $request) {\n      accessToken\n    }\n  }\n"): (typeof documents)["\n  mutation SignUp($request: SignUpRequest!) {\n    signUp(signUpRequest: $request) {\n      accessToken\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTaskConditionPlugins($page: Int!, $pageSize: Int!) {\n    getAllPlugins(\n      request: { filter: { isValid: true }, pagination: { page: $page, pageSize: $pageSize } }\n    ) {\n      items {\n        id\n        name\n        description\n        category\n        pluginType\n        graphType\n        isValid\n      }\n      pagination {\n        hasNext\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetTaskConditionPlugins($page: Int!, $pageSize: Int!) {\n    getAllPlugins(\n      request: { filter: { isValid: true }, pagination: { page: $page, pageSize: $pageSize } }\n    ) {\n      items {\n        id\n        name\n        description\n        category\n        pluginType\n        graphType\n        isValid\n      }\n      pagination {\n        hasNext\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTaskGraph($task: TaskGraphInput!) {\n    createTaskGraph(task: $task) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTaskGraph($task: TaskGraphInput!) {\n    createTaskGraph(task: $task) {\n      id\n      name\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;