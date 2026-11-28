import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client/core";
import { GraphQLError } from "graphql";
import { getAuthErrorMessage } from "./getAuthErrorMessage";

function backendError(classification: string, message: string): ApolloError {
  return new ApolloError({
    graphQLErrors: [new GraphQLError(message, { extensions: { classification } })],
  });
}

describe("getAuthErrorMessage", () => {
  it("без ошибки возвращает пустую строку", () => {
    expect(getAuthErrorMessage(null, "sign-in")).toBe("");
  });

  it("при сетевой ошибке говорит, что нет связи", () => {
    const error = new ApolloError({ networkError: new Error("Failed to fetch") });

    expect(getAuthErrorMessage(error, "sign-in")).toBe("Нет связи с сервером");
    expect(getAuthErrorMessage(error, "sign-up")).toBe("Нет связи с сервером");
  });

  it("на входе не уточняет, почта неверная или пароль", () => {
    expect(getAuthErrorMessage(backendError("NOT_FOUND", "Профиль не найден"), "sign-in")).toBe(
      "Неверная почта или пароль",
    );
    expect(
      getAuthErrorMessage(backendError("UNAUTHORIZED", "Неправильный пароль"), "sign-in"),
    ).toBe("Неверная почта или пароль");
    expect(
      getAuthErrorMessage(backendError("BAD_REQUEST", "Email имеет некорректный вид"), "sign-in"),
    ).toBe("Неверная почта или пароль");
  });

  it("на регистрации показывает текст бэка для неверных данных", () => {
    const error = backendError(
      "BAD_REQUEST",
      "Пользователь с данной электронной почтой уже существует",
    );

    expect(getAuthErrorMessage(error, "sign-up")).toBe(
      "Пользователь с данной электронной почтой уже существует",
    );
  });

  it("при запросе ссылки говорит, что почты нет, и показывает ошибки проверки", () => {
    expect(
      getAuthErrorMessage(backendError("NOT_FOUND", "Профиль не найден"), "send-reset-link"),
    ).toBe("Если такая почта есть, мы отправили на неё ссылку");
    expect(
      getAuthErrorMessage(
        backendError("BAD_REQUEST", "Email имеет некорректный вид"),
        "send-reset-link",
      ),
    ).toBe("Email имеет некорректный вид");
  });

  it("при смене пароля по ссылке говорит, что ссылка устарела", () => {
    expect(
      getAuthErrorMessage(backendError("BAD_REQUEST", "Некорректный токен"), "reset-password"),
    ).toBe("Ссылка недействительна или устарела. Запросите новую.");
  });

  it("при сбое на бэке не показывает его текст", () => {
    const error = backendError("INTERNAL_ERROR", "NullPointerException");

    expect(getAuthErrorMessage(error, "sign-in")).toBe("Что-то пошло не так, попробуйте позже");
    expect(getAuthErrorMessage(error, "sign-up")).toBe("Что-то пошло не так, попробуйте позже");
  });
});
