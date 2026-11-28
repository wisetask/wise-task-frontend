import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import { GraphQLError } from "graphql";
import { deleteAccountErrorMessage, isDeleteConfirmed } from "./deleteConfirm";

describe("isDeleteConfirmed", () => {
  it("confirms when the typed email matches", () => {
    expect(isDeleteConfirmed("student@etu.ru", "student@etu.ru")).toBe(true);
  });

  it("ignores case and spaces around", () => {
    expect(isDeleteConfirmed("  Student@ETU.ru ", "student@etu.ru")).toBe(true);
  });

  it("does not confirm another email or an empty field", () => {
    expect(isDeleteConfirmed("other@etu.ru", "student@etu.ru")).toBe(false);
    expect(isDeleteConfirmed("", "student@etu.ru")).toBe(false);
    expect(isDeleteConfirmed("student@etu", "student@etu.ru")).toBe(false);
  });

  it("never confirms when the email is unknown", () => {
    expect(isDeleteConfirmed("", "")).toBe(false);
  });
});

describe("deleteAccountErrorMessage", () => {
  it("returns nothing without an error", () => {
    expect(deleteAccountErrorMessage(null)).toBe("");
  });

  it("reports a network failure", () => {
    const error = new ApolloError({ networkError: new Error("Failed to fetch") });
    expect(deleteAccountErrorMessage(error)).toBe("Нет связи с сервером");
  });

  it("does not show the backend text", () => {
    const error = new ApolloError({
      graphQLErrors: [
        new GraphQLError("Профиль не найден", { extensions: { classification: "NOT_FOUND" } }),
      ],
    });
    expect(deleteAccountErrorMessage(error)).toBe(
      "Не получилось удалить аккаунт, попробуйте позже",
    );
  });
});
