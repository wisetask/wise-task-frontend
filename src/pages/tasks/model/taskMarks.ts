export type TaskMark = "solved" | "tried";

export interface SolutionMarkItem {
  isCorrect: boolean;
  task?: { id: string } | null;
}

export const CATEGORY_COLORS = 6;

export function taskMarks(items: SolutionMarkItem[]): Record<string, TaskMark> {
  const marks: Record<string, TaskMark> = {};
  for (const item of items) {
    if (!item.task) {
      continue;
    }
    if (item.isCorrect) {
      marks[item.task.id] = "solved";
    } else if (marks[item.task.id] === undefined) {
      marks[item.task.id] = "tried";
    }
  }
  return marks;
}

export function markTitle(mark: TaskMark | undefined): string {
  if (mark === "solved") {
    return "Решена";
  }
  if (mark === "tried") {
    return "Были попытки";
  }
  return "";
}

export function categoryColor(category: string): number {
  const text = category.trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100003;
  }
  return hash % CATEGORY_COLORS;
}
