import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import { GraphQLError } from "graphql";
import { createErrorMessage } from "./createError";

function backendError(classification: string, message: string): ApolloError {
  return new ApolloError({
    graphQLErrors: [new GraphQLError(message, { extensions: { classification } })],
  });
}

describe("createErrorMessage", () => {
  it("returns nothing without an error", () => {
    expect(createErrorMessage(null)).toBe("");
  });

  it("tells that the server is not reachable", () => {
    const error = new ApolloError({ networkError: new Error("Failed to fetch") });
    expect(createErrorMessage(error)).toContain("Нет связи с сервером");
  });

  it("explains who may create tasks", () => {
    expect(createErrorMessage(backendError("UNAUTHORIZED", "Access Denied"))).toBe(
      "Войдите, чтобы создать задачу.",
    );
    expect(createErrorMessage(backendError("FORBIDDEN", "Access Denied"))).toBe(
      "Создавать задачи могут только авторы и администраторы.",
    );
  });

  it("shows the backend text for wrong data", () => {
    expect(createErrorMessage(backendError("BAD_REQUEST", "Название слишком длинное"))).toBe(
      "Сервер не принял задачу: Название слишком длинное",
    );
  });

  it("hides the text of a backend failure", () => {
    expect(createErrorMessage(backendError("INTERNAL_ERROR", "NullPointerException"))).toBe(
      "Не получилось создать задачу, попробуйте позже.",
    );
  });
});
