import type { ApolloError } from "@apollo/client/core";

// бэк принимает пароль от 3 символов
export const MIN_PASSWORD_LENGTH = 3;

export interface PasswordChangeForm {
  oldPassword: string;
  newPassword: string;
  repeatPassword: string;
}

export interface PasswordChangeErrors {
  oldPassword: string;
  newPassword: string;
  repeatPassword: string;
}

export function checkPasswordChange(form: PasswordChangeForm): PasswordChangeErrors {
  const errors: PasswordChangeErrors = { oldPassword: "", newPassword: "", repeatPassword: "" };

  if (form.oldPassword === "") {
    errors.oldPassword = "Введите текущий пароль";
  }

  if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = "Не короче 3 символов";
  } else if (form.newPassword === form.oldPassword) {
    errors.newPassword = "Новый пароль совпадает с текущим";
  }

  if (form.repeatPassword !== form.newPassword) {
    errors.repeatPassword = "Пароли не совпадают";
  }

  return errors;
}

export function hasErrors(errors: PasswordChangeErrors): boolean {
  return errors.oldPassword !== "" || errors.newPassword !== "" || errors.repeatPassword !== "";
}

// неверный текущий пароль бэк сейчас отдаёт как UNAUTHORIZED,
// будет отдавать как BAD_REQUEST. тут сразу обрабатываем оба
export function changePasswordErrorMessage(error: ApolloError | null): string {
  if (error === null) {
    return "";
  }
  if (error.networkError) {
    return "Нет связи с сервером";
  }

  const graphqlError = error.graphQLErrors[0];
  const classification =
    graphqlError === undefined ? null : graphqlError.extensions?.classification;

  if (classification === "UNAUTHORIZED") {
    return "Неверный текущий пароль";
  }
  if (classification === "BAD_REQUEST") {
    return graphqlError.message;
  }
  return "Что-то пошло не так, попробуйте позже";
}
