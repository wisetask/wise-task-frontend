import type { Role } from "@/shared/api";
import type { User } from "../model/types";

export interface AccessRule {
  requiresAuth?: boolean;
  roles?: readonly Role[];
}

export type AccessResult = "allow" | "sign-in" | "forbidden";

export function checkAccess(user: User | null, rule: AccessRule): AccessResult {
  const roles = rule.roles ?? [];
  const needsAuth = rule.requiresAuth === true || roles.length > 0;

  if (!needsAuth) {
    return "allow";
  }
  if (user === null) {
    return "sign-in";
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return "forbidden";
  }
  return "allow";
}
