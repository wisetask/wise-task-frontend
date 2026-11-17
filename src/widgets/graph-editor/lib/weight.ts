const WEIGHT_PATTERN = /^-?\d+$/;
const UNFINISHED_PATTERN = /^-?$/;

export function parseWeight(text: string): number | null {
  const trimmed = text.trim();
  if (!WEIGHT_PATTERN.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

export function weightError(text: string): string {
  const trimmed = text.trim();
  if (WEIGHT_PATTERN.test(trimmed) || UNFINISHED_PATTERN.test(trimmed)) {
    return "";
  }
  return "Нужно целое число, например 3 или -2";
}
