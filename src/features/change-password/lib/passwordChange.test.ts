import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import { GraphQLError } from "graphql";
import { changePasswordErrorMessage, checkPasswordChange, hasErrors } from "./passwordChange";

function backendError(classification: string, message: string): ApolloError {
  return new ApolloError({
    graphQLErrors: [new GraphQLError(message, { extensions: { classification: classification } })],
  });
}

describe("checkPasswordChange", () => {
  it("accepts a correct form", () => {
    const errors = checkPasswordChange({
      oldPassword: "old-pass",
      newPassword: "new-pass",
      repeatPassword: "new-pass",
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it("asks for the current password", () => {
    const errors = checkPasswordChange({
      oldPassword: "",
      newPassword: "new-pass",
      repeatPassword: "new-pass",
    });
    expect(errors.oldPassword).toBe("Введите текущий пароль");
  });

  it("rejects a short new password", () => {
    const errors = checkPasswordChange({
      oldPassword: "old",
      newPassword: "ab",
      repeatPassword: "ab",
    });
    expect(errors.newPassword).toBe("Не короче 3 символов");
  });

  it("rejects a new password equal to the current one", () => {
    const errors = checkPasswordChange({
      oldPassword: "same-pass",
      newPassword: "same-pass",
      repeatPassword: "same-pass",
    });
    expect(errors.newPassword).toBe("Новый пароль совпадает с текущим");
  });

  it("rejects a repeat that does not match", () => {
    const errors = checkPasswordChange({
      oldPassword: "old-pass",
      newPassword: "new-pass",
      repeatPassword: "new-pas",
    });
    expect(errors.repeatPassword).toBe("Пароли не совпадают");
    expect(hasErrors(errors)).toBe(true);
  });
});

describe("changePasswordErrorMessage", () => {
  it("returns nothing without an error", () => {
    expect(changePasswordErrorMessage(null)).toBe("");
  });

  it("says the current password is wrong", () => {
    const error = backendError("UNAUTHORIZED", "Неправильный пароль");
    expect(changePasswordErrorMessage(error)).toBe("Неверный текущий пароль");
  });

  it("shows the backend text for invalid data", () => {
    const error = backendError("BAD_REQUEST", "Неправильный пароль");
    expect(changePasswordErrorMessage(error)).toBe("Неправильный пароль");
  });

  it("does not show the text of a backend failure", () => {
    const error = backendError("INTERNAL_ERROR", "NullPointerException");
    expect(changePasswordErrorMessage(error)).toBe("Что-то пошло не так, попробуйте позже");
  });

  it("reports a network failure", () => {
    const error = new ApolloError({ networkError: new Error("Failed to fetch") });
    expect(changePasswordErrorMessage(error)).toBe("Нет связи с сервером");
  });
});
