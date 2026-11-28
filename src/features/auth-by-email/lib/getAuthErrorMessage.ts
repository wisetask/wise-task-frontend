import type { ApolloError } from "@apollo/client/core";

export type AuthAction = "sign-in" | "sign-up" | "send-reset-link" | "reset-password";

const SIGN_IN_FAILED = ["NOT_FOUND", "UNAUTHORIZED", "BAD_REQUEST"];
const DATA_ERRORS = ["NOT_FOUND", "BAD_REQUEST"];

export function getAuthErrorMessage(error: ApolloError | null, action: AuthAction): string {
  if (!error) {
    return "";
  }

  if (error.networkError) {
    return "Нет связи с сервером";
  }

  const graphqlError = error.graphQLErrors[0];
  const classification = graphqlError?.extensions?.classification;
  const isDataError = typeof classification === "string" && DATA_ERRORS.includes(classification);

  if (action === "sign-in") {
    if (typeof classification === "string" && SIGN_IN_FAILED.includes(classification)) {
      return "Неверная почта или пароль";
    }
  } else if (action === "send-reset-link") {
    if (classification === "NOT_FOUND") {
      return "Пользователь с такой почтой не найден";
    }
    if (isDataError) {
      return graphqlError.message;
    }
  } else if (action === "reset-password") {
    // Бэк отказывает, только если ссылка неверная или её 10 минут истекли.
    if (isDataError) {
      return "Ссылка недействительна или устарела. Запросите новую.";
    }
  } else if (classification === "BAD_REQUEST") {
    return graphqlError.message;
  }

  return "Что-то пошло не так, попробуйте позже";
}
