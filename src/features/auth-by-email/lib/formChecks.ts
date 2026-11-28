export { passwordStrength, type PasswordStrength } from "@/shared/lib/passwordStrength";

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function filledShare(checks: boolean[]): number {
  if (checks.length === 0) {
    return 0;
  }
  let filled = 0;
  for (const check of checks) {
    if (check) {
      filled = filled + 1;
    }
  }
  return filled / checks.length;
}
