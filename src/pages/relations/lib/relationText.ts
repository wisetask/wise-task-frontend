import type { MultiplyKind } from "@/entities/relation";
import type { UiSegmentedOption } from "@/shared/ui";

export const MIN_POWER = 2;
export const MAX_POWER = 5;

// Сколько путей показывать под матрицей, остальные сворачиваются в «и ещё N»
const MAX_SHOWN_PATHS = 10;

const SUPERSCRIPTS = ["", "", "²", "³", "⁴", "⁵"];

export const MULTIPLY_OPTIONS: UiSegmentedOption[] = [
  { value: "classic", label: "Классическое" },
  { value: "logical", label: "Логическое" },
  { value: "tropical", label: "Тропическое" },
];

export function powerTitle(exponent: number): string {
  if (exponent >= MIN_POWER && exponent <= MAX_POWER) {
    return "A" + SUPERSCRIPTS[exponent];
  }
  return "A^" + exponent;
}

export function powerOptions(): UiSegmentedOption[] {
  const options: UiSegmentedOption[] = [];
  for (let exponent = MIN_POWER; exponent <= MAX_POWER; exponent++) {
    options.push({ value: String(exponent), label: powerTitle(exponent) });
  }
  return options;
}

export function toMultiplyKind(value: string): MultiplyKind {
  if (value === "logical" || value === "tropical") {
    return value;
  }
  return "classic";
}

export function toExponent(value: string): number {
  const exponent = Number(value);
  if (!Number.isInteger(exponent) || exponent < MIN_POWER) {
    return MIN_POWER;
  }
  if (exponent > MAX_POWER) {
    return MAX_POWER;
  }
  return exponent;
}

export function hoverHint(exponent: number): string {
  const cell = powerTitle(exponent);
  return "Наведите на клетку " + cell + ", чтобы увидеть пути длины " + exponent + ".";
}

function pathText(path: number[], weight: number | null): string {
  const text = path.map((vertex) => vertex + 1).join(" → ");
  if (weight === null) {
    return text;
  }
  return text + " (вес " + weight + ")";
}

// Пути под матрицей: «Из 1 в 4: 1 → 2 → 4, 1 → 3 → 4». Элементы на экране считаются с 1.
// weights — вес каждого пути по порядку (для тропического умножения), иначе null.
export function describePaths(
  from: number,
  to: number,
  paths: number[][],
  exponent: number,
  weights: number[] | null,
): string {
  const head = "Из " + (from + 1) + " в " + (to + 1);
  if (paths.length === 0) {
    return head + " путей длины " + exponent + " нет.";
  }
  const shown: string[] = [];
  for (let i = 0; i < paths.length && i < MAX_SHOWN_PATHS; i++) {
    shown.push(pathText(paths[i], weights === null ? null : weights[i]));
  }
  let text = head + ": " + shown.join(", ");
  if (paths.length > MAX_SHOWN_PATHS) {
    text = text + ", … и ещё " + (paths.length - MAX_SHOWN_PATHS);
  }
  return text;
}

export function progressText(filled: number, total: number, mistakes: number): string {
  return "Заполнено " + filled + " из " + total + ", ошибок: " + mistakes;
}
