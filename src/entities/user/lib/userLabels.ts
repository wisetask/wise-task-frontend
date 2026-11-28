export function roleTitle(role: string): string {
  if (role === "USER") {
    return "Студент";
  }
  if (role === "AUTHOR") {
    return "Автор";
  }
  if (role === "ADMIN") {
    return "Администратор";
  }
  return role;
}

function firstLetter(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") {
    return "";
  }
  return Array.from(trimmed)[0].toUpperCase();
}

export function userInitials(firstName: string, lastName: string, email: string): string {
  const fromName = firstLetter(lastName) + firstLetter(firstName);
  if (fromName !== "") {
    return fromName;
  }

  const fromEmail = firstLetter(email);
  if (fromEmail !== "") {
    return fromEmail;
  }

  return "?";
}

export function fullName(lastName: string, firstName: string, patronymic: string | null): string {
  const parts: string[] = [];
  for (const part of [lastName, firstName, patronymic === null ? "" : patronymic]) {
    const trimmed = part.trim();
    if (trimmed !== "") {
      parts.push(trimmed);
    }
  }
  return parts.join(" ");
}
