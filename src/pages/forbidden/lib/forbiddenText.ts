import type { Role } from "@/shared/api";

const ROLE_DATIVE: Record<Role, string> = {
  USER: "студентам",
  AUTHOR: "авторам",
  ADMIN: "администраторам",
};

export function forbiddenText(roles: readonly Role[] | undefined): string {
  if (!roles || roles.length === 0) {
    return "У вас нет доступа к этой странице";
  }

  const names = roles.map((role) => ROLE_DATIVE[role]);
  const list =
    names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " и " + names[names.length - 1];

  return "Эта страница доступна только " + list;
}
