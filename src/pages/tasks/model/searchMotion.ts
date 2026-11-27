import type { TaskListItem } from "./taskList";

export const BASE_PLACEHOLDER = "Найти задачу по названию";
export const PLACEHOLDER_HOLD = 28;
export const EXAMPLE_LENGTH = 30;

export function countStep(from: number, to: number, progress: number): number {
  let clamped = progress;
  if (clamped < 0) {
    clamped = 0;
  }
  if (clamped > 1) {
    clamped = 1;
  }
  const eased = 1 - Math.pow(1 - clamped, 3);
  return Math.round(from + (to - from) * eased);
}

export function placeholderExamples(tasks: TaskListItem[], limit: number): string[] {
  const result: string[] = [];
  const known: Record<string, boolean> = {};
  for (const task of tasks) {
    const name = task.name.trim();
    if (name.length < 4 || name.length > EXAMPLE_LENGTH || known[name.toLowerCase()]) {
      continue;
    }
    known[name.toLowerCase()] = true;
    result.push("например, " + name);
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

function phraseSteps(phrase: string): number {
  return phrase.length + PLACEHOLDER_HOLD + Math.ceil(phrase.length / 2);
}

export function placeholderFrame(phrases: string[], step: number): string {
  if (phrases.length === 0) {
    return "";
  }
  let total = 0;
  for (const phrase of phrases) {
    total = total + phraseSteps(phrase);
  }
  let left = step % total;
  for (const phrase of phrases) {
    const steps = phraseSteps(phrase);
    if (left < steps) {
      if (left < phrase.length) {
        return phrase.slice(0, left + 1);
      }
      if (left < phrase.length + PLACEHOLDER_HOLD) {
        return phrase;
      }
      const erased = (left - phrase.length - PLACEHOLDER_HOLD + 1) * 2;
      return phrase.slice(0, Math.max(phrase.length - erased, 0));
    }
    left = left - steps;
  }
  return phrases[0];
}

export const GRAPH_CODE = ["KeyU", "KeyH", "KeyF", "KeyA"];
export const TILT_MAX = 3;

export interface Tilt {
  x: number;
  y: number;
}

export function pushCode(buffer: string[], code: string, secret: string[]): string[] {
  const result = buffer.concat([code]);
  return result.slice(Math.max(result.length - secret.length, 0));
}

export function codeMatches(buffer: string[], secret: string[]): boolean {
  if (buffer.length !== secret.length) {
    return false;
  }
  for (let index = 0; index < secret.length; index++) {
    if (buffer[index] !== secret[index]) {
      return false;
    }
  }
  return true;
}

function withoutMinusZero(value: number): number {
  if (value === 0) {
    return 0;
  }
  return value;
}

export function tiltAngles(x: number, y: number, width: number, height: number): Tilt {
  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }
  const across = Math.min(Math.max(x / width, 0), 1) - 0.5;
  const down = Math.min(Math.max(y / height, 0), 1) - 0.5;
  return {
    x: withoutMinusZero(Math.round(-down * 2 * TILT_MAX * 10) / 10),
    y: withoutMinusZero(Math.round(across * 2 * TILT_MAX * 10) / 10),
  };
}

export function chainLinks(count: number): number[][] {
  const links: number[][] = [];
  for (let index = 0; index + 1 < count; index++) {
    links.push([index, index + 1]);
    if (index % 3 === 0 && index + 2 < count) {
      links.push([index, index + 2]);
    }
  }
  return links;
}

const KONIGSBERG_WORDS = ["кенигсберг", "кёнигсберг", "konigsberg", "königsberg"];
const EULER_WORDS = ["эйлер", "euler"];

export function wantsKonigsberg(query: string, found: number | null): boolean {
  const text = query.trim().toLowerCase();
  if (text === "") {
    return false;
  }
  for (const word of KONIGSBERG_WORDS) {
    if (text.includes(word)) {
      return true;
    }
  }
  if (found !== 0) {
    return false;
  }
  for (const word of EULER_WORDS) {
    if (text.includes(word)) {
      return true;
    }
  }
  return false;
}

export interface PopoverPlace {
  left: number;
  top: number;
}

export function popoverPlace(
  card: { left: number; right: number; top: number },
  viewportWidth: number,
  viewportHeight: number,
  width: number,
  height: number,
): PopoverPlace | null {
  const gap = 14;
  let left = card.right + gap;
  if (viewportWidth - card.right < width + gap * 2) {
    if (card.left < width + gap * 2) {
      return null;
    }
    left = card.left - width - gap;
  }
  const lowest = Math.max(viewportHeight - height - gap, gap);
  const top = Math.min(Math.max(card.top, 72), lowest);
  return { left: Math.round(left), top: Math.round(top) };
}
