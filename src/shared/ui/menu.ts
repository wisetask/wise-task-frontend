export interface UiMenuItem {
  id: string;
  label: string;
  hint?: string;
}

export function nextMenuIndex(current: number, step: number, count: number): number {
  if (count === 0) {
    return -1;
  }
  if (current < 0) {
    return step > 0 ? 0 : count - 1;
  }
  return (current + step + count) % count;
}
