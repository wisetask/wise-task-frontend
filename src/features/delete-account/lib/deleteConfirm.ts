import type { ApolloError } from "@apollo/client/core";

export function isDeleteConfirmed(typed: string, email: string): boolean {
  const expected = email.trim().toLowerCase();
  if (expected === "") {
    return false;
  }
  return typed.trim().toLowerCase() === expected;
}

export function deleteAccountErrorMessage(error: ApolloError | null): string {
  if (error === null) {
    return "";
  }
  if (error.networkError) {
    return "Нет связи с сервером";
  }
  return "Не получилось удалить аккаунт, попробуйте позже";
}
