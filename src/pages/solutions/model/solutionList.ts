import { ApolloError } from "@apollo/client/core";

export type SolutionFilter = "all" | "solved" | "unsolved";

export interface SolutionListItem {
  id: string;
  taskId: string | null;
  taskName: string;
  category: string;
  isCorrect: boolean;
  isGraph: boolean;
}

export interface BackendSolutionItem {
  __typename?: string;
  id: string;
  isCorrect: boolean;
  task?: { id: string; name: string; category: string } | null;
}

export interface AttemptDot {
  id: string;
  isCorrect: boolean;
}

export interface TaskGroup {
  key: string;
  taskId: string | null;
  taskName: string;
  category: string;
  isGraph: boolean;
  attempts: AttemptDot[];
  solved: boolean;
  lastId: string;
  lastCorrect: boolean;
  order: number;
}

export interface ShownDots {
  dots: AttemptDot[];
  hidden: number;
}

export const SOLUTION_FILTERS: SolutionFilter[] = ["all", "solved", "unsolved"];

export const FILTER_TITLES: Record<SolutionFilter, string> = {
  all: "Все",
  solved: "Решённые",
  unsolved: "Не решённые",
};

export function toSolutionItem(item: BackendSolutionItem): SolutionListItem {
  let taskName = "Задача удалена";
  let category = "";
  let taskId: string | null = null;
  if (item.task) {
    taskName = item.task.name;
    category = item.task.category;
    taskId = item.task.id;
  }
  return {
    id: item.id,
    taskId: taskId,
    taskName: taskName,
    category: category,
    isCorrect: item.isCorrect,
    isGraph: item.__typename !== "SolutionImplementation",
  };
}

export function groupSolutions(items: SolutionListItem[]): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const byKey: Record<string, TaskGroup> = {};
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const key = item.taskId === null ? "deleted-" + item.id : item.taskId;
    let group = byKey[key];
    if (group === undefined) {
      group = {
        key: key,
        taskId: item.taskId,
        taskName: item.taskName,
        category: item.category,
        isGraph: item.isGraph,
        attempts: [],
        solved: false,
        lastId: item.id,
        lastCorrect: item.isCorrect,
        order: index,
      };
      byKey[key] = group;
      groups.push(group);
    }
    group.attempts.push({ id: item.id, isCorrect: item.isCorrect });
    group.solved = group.solved || item.isCorrect;
    group.lastId = item.id;
    group.lastCorrect = item.isCorrect;
    group.order = index;
  }
  groups.sort((first, second) => second.order - first.order);
  return groups;
}

export function groupMatches(
  group: TaskGroup,
  filter: SolutionFilter,
  query: string,
  category: string,
): boolean {
  if (filter === "solved" && !group.solved) {
    return false;
  }
  if (filter === "unsolved" && group.solved) {
    return false;
  }
  if (category !== "" && group.category !== category) {
    return false;
  }
  const text = query.trim().toLowerCase();
  return text === "" || group.taskName.toLowerCase().includes(text);
}

export function groupCategories(groups: TaskGroup[], limit: number): string[] {
  const counts: Record<string, number> = {};
  const names: string[] = [];
  for (const group of groups) {
    const name = group.category.trim();
    if (name === "") {
      continue;
    }
    if (counts[name] === undefined) {
      counts[name] = 0;
      names.push(name);
    }
    counts[name] = counts[name] + 1;
  }
  names.sort((first, second) => counts[second] - counts[first]);
  return names.slice(0, limit);
}

export function stuckGroups(groups: TaskGroup[], limit: number): TaskGroup[] {
  const result: TaskGroup[] = [];
  for (const group of groups) {
    if (!group.solved && group.taskId !== null) {
      result.push(group);
    }
  }
  result.sort((first, second) => second.attempts.length - first.attempts.length);
  return result.slice(0, limit);
}

export function shownDots(attempts: AttemptDot[], limit: number): ShownDots {
  if (attempts.length <= limit) {
    return { dots: attempts, hidden: 0 };
  }
  return { dots: attempts.slice(attempts.length - limit), hidden: attempts.length - limit };
}

export function plural(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return many;
  }
  if (last === 1) {
    return one;
  }
  if (last >= 2 && last <= 4) {
    return few;
  }
  return many;
}

export function attemptsText(count: number): string {
  return count + " " + plural(count, "попытка", "попытки", "попыток");
}

export function groupSummary(group: TaskGroup): string {
  if (!group.solved) {
    return "Пока не решена";
  }
  let first = 0;
  while (first < group.attempts.length && !group.attempts[first].isCorrect) {
    first = first + 1;
  }
  if (first === 0) {
    return "Решена с первой попытки";
  }
  return "Решена с " + (first + 1) + "-й попытки";
}

export function groupsFoundText(count: number): string {
  return "Найдено " + count + " " + plural(count, "задача", "задачи", "задач");
}

export function emptySolutionsText(filter: SolutionFilter, searching: boolean): string {
  if (searching) {
    return "По этому запросу ничего не нашлось.";
  }
  if (filter === "solved") {
    return "Решённых задач пока нет.";
  }
  if (filter === "unsolved") {
    return "Нерешённых задач нет — всё, что пробовали, решено.";
  }
  return "Вы ещё не решали задачи. Выберите задачу в разделе «Задачи».";
}

export function loadSolutionsErrorText(error: unknown): string {
  if (error instanceof ApolloError && error.networkError) {
    return "Нет связи с сервером.";
  }
  return "Не получилось загрузить решения.";
}
