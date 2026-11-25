import type { ApolloError } from "@apollo/client/core";

const SIGN_IN_FAILED = ["NOT_FOUND", "UNAUTHORIZED", "BAD_REQUEST"];

export function getAuthErrorMessage(
  error: ApolloError | null,
  action: "sign-in" | "sign-up",
): string {
  if (!error) {
    return "";
  }

  if (error.networkError) {
    return "Нет связи с сервером";
  }

  const graphqlError = error.graphQLErrors[0];
  const classification = graphqlError?.extensions?.classification;

  if (
    action === "sign-in" &&
    typeof classification === "string" &&
    SIGN_IN_FAILED.includes(classification)
  ) {
    return "Неверная почта или пароль";
  }

  if (action === "sign-up" && classification === "BAD_REQUEST") {
    return graphqlError.message;
  }

  return "Что-то пошло не так, попробуйте позже";
}
