export type Theme = "day" | "night";

export const THEME_KEY = "wisetask.theme";

export function parseTheme(value: string | null | undefined): Theme | null {
  if (value === "day" || value === "night") {
    return value;
  }
  return null;
}

export function initialTheme(stored: string | null, prefersDark: boolean): Theme {
  const theme = parseTheme(stored);
  if (theme !== null) {
    return theme;
  }
  if (prefersDark) {
    return "night";
  }
  return "day";
}

export function nextTheme(theme: Theme): Theme {
  if (theme === "day") {
    return "night";
  }
  return "day";
}

export function toggleTitle(theme: Theme): string {
  if (theme === "day") {
    return "Включить ночную тему";
  }
  return "Включить дневную тему";
}

export function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    return;
  }
}

export function currentTheme(): Theme {
  const fromPage = parseTheme(document.documentElement.dataset.theme);
  if (fromPage !== null) {
    return fromPage;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return initialTheme(readStoredTheme(), prefersDark);
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}
