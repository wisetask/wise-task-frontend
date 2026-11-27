export interface TaskLink {
  id: string;
  name: string;
}

export interface Attempt {
  id: string;
  isCorrect: boolean;
}

export const ATTEMPTS_SHOWN = 8;

export function pickNextTask(
  items: TaskLink[],
  currentId: string,
  random: number,
): TaskLink | null {
  const others: TaskLink[] = [];
  for (const item of items) {
    if (item.id !== currentId) {
      others.push(item);
    }
  }
  if (others.length === 0) {
    return null;
  }
  const index = Math.min(Math.floor(random * others.length), others.length - 1);
  return others[index];
}

export function recentAttempts(items: Attempt[]): Attempt[] {
  const result: Attempt[] = [];
  for (let index = items.length - 1; index >= 0 && result.length < ATTEMPTS_SHOWN; index--) {
    result.push(items[index]);
  }
  return result;
}

export function attemptTitle(position: number, total: number): string {
  return "Попытка " + (total - position);
}
