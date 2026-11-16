const WEIGHT_PATTERN = /^-?\d+([.,]\d+)?$/;

export function parseWeight(text: string): number | null {
  const trimmed = text.trim();
  if (!WEIGHT_PATTERN.test(trimmed)) {
    return null;
  }
  return Number(trimmed.replace(",", "."));
}
