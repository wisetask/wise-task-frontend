import type { ApolloError } from "@apollo/client/core";

export function createErrorMessage(error: ApolloError | null): string {
  if (error === null) {
    return "";
  }
  if (error.networkError) {
    return "Нет связи с сервером. Черновик сохранён, попробуйте ещё раз.";
  }

  const graphqlError = error.graphQLErrors[0];
  if (graphqlError === undefined) {
    return "Не получилось создать задачу, попробуйте позже.";
  }

  const classification = graphqlError.extensions?.classification;
  if (classification === "UNAUTHORIZED") {
    return "Войдите, чтобы создать задачу.";
  }
  if (classification === "FORBIDDEN") {
    return "Создавать задачи могут только авторы и администраторы.";
  }
  if (classification === "BAD_REQUEST") {
    return "Сервер не принял задачу: " + graphqlError.message;
  }
  return "Не получилось создать задачу, попробуйте позже.";
}
