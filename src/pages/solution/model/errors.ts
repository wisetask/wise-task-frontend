import { ApolloError } from "@apollo/client/core";

export function isSolutionMissing(error: unknown): boolean {
  if (!(error instanceof ApolloError)) {
    return false;
  }
  const graphqlError = error.graphQLErrors[0];
  if (graphqlError === undefined) {
    return false;
  }
  return graphqlError.extensions?.classification === "NOT_FOUND";
}

export function loadSolutionErrorText(error: unknown): string {
  if (error instanceof ApolloError && error.networkError) {
    return "Нет связи с сервером.";
  }
  if (isSolutionMissing(error)) {
    return "Такого решения нет. Возможно, его удалили.";
  }
  return "Не получилось загрузить решение.";
}
