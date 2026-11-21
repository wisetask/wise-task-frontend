// Куда вернуть человека после входа. Берём только адреса внутри сайта:
// "//evil.com" браузер понял бы как чужой сайт.
export function getRedirectPath(redirect: unknown): string {
  if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/";
}
