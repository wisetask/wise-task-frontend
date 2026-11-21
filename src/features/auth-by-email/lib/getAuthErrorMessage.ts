import type { ApolloError } from "@apollo/client/core";

// перепишу как бек обновится

const SIGN_IN_FAILED_CODES = ["NOT_FOUND", "UNAUTHENTICATED", "INVALID_ARGUMENT"];

export function getAuthErrorMessage(
  error: ApolloError | null,
  action: "sign-in" | "sign-up",
): string {
  if (!error) {
    return "";
  }

  const graphqlError = error.graphQLErrors[0];
  if (!graphqlError) {
    return "Нет связи с сервером";
  }

  const [code, ...rest] = graphqlError.message.split(": ");
  const text = rest.join(": ");

  if (action === "sign-in" && SIGN_IN_FAILED_CODES.includes(code)) {
    return "Неверная почта или пароль";
  }

  return text || graphqlError.message;
}
