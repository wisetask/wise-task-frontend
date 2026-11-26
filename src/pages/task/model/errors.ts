import { ApolloError } from "@apollo/client/core";

function classificationOf(error: unknown): string {
  if (!(error instanceof ApolloError)) {
    return "";
  }
  const graphqlError = error.graphQLErrors[0];
  if (graphqlError === undefined) {
    return "";
  }
  const classification = graphqlError.extensions?.classification;
  if (typeof classification === "string") {
    return classification;
  }
  return "";
}

function isNetworkError(error: unknown): boolean {
  return error instanceof ApolloError && Boolean(error.networkError);
}

export function loadTaskErrorText(error: unknown): string {
  if (isNetworkError(error)) {
    return "Нет связи с сервером.";
  }
  if (classificationOf(error) === "NOT_FOUND") {
    return "Такой задачи нет. Возможно, её удалили.";
  }
  return "Не получилось загрузить задачу.";
}

export function isTaskMissing(error: unknown): boolean {
  return classificationOf(error) === "NOT_FOUND";
}

export function solveErrorText(error: unknown): string {
  if (isNetworkError(error)) {
    return "Нет связи с сервером. Ответ остался на месте, попробуйте ещё раз.";
  }
  const classification = classificationOf(error);
  if (classification === "UNAUTHORIZED") {
    return "Войдите, чтобы проверить решение.";
  }
  if (classification === "BAD_REQUEST" && error instanceof ApolloError) {
    return "Сервер не принял решение: " + error.graphQLErrors[0].message;
  }
  return "Не получилось проверить решение, попробуйте позже.";
}
