export interface PasswordStrength {
  level: number;
  title: string;
}

// оценка надежность для полоски под полем пароля
export function passwordStrength(password: string): PasswordStrength {
  if (password === "") {
    return { level: 0, title: "" };
  }
  if (password.length < 3) {
    return { level: 1, title: "Слишком короткий" };
  }
  const hasLetter = /[a-zа-я]/i.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasOther = /[^a-zа-я0-9]/i.test(password);
  const hasBothCases = /[a-zа-я]/.test(password) && /[A-ZА-Я]/.test(password);
  if (password.length >= 10 && hasLetter && hasDigit && (hasOther || hasBothCases)) {
    return { level: 4, title: "Отличный" };
  }
  if (password.length >= 8 && hasLetter && hasDigit) {
    return { level: 3, title: "Хороший" };
  }
  return { level: 2, title: "Слабый" };
}
