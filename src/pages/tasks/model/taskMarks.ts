export { CATEGORY_COLORS, categoryColor } from "@/shared/lib/categoryColor";

export type TaskMark = "solved" | "tried";

export interface SolutionMarkItem {
  isCorrect: boolean;
  task?: { id: string } | null;
}

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
