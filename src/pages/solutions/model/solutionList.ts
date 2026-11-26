import { ApolloError } from "@apollo/client/core";

export type SolutionFilter = "all" | "correct" | "wrong";

export interface SolutionListItem {
  id: string;
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

export const SOLUTION_FILTERS: SolutionFilter[] = ["all", "correct", "wrong"];

export const FILTER_TITLES: Record<SolutionFilter, string> = {
  all: "Все",
  correct: "Верные",
  wrong: "Неверные",
};

export function filterToCorrect(filter: SolutionFilter): boolean | null {
  if (filter === "correct") {
    return true;
  }
  return null;
}

export function keepForFilter(item: SolutionListItem, filter: SolutionFilter): boolean {
  if (filter === "wrong") {
    return !item.isCorrect;
  }
  return true;
}

export function wrongCount(allCount: number | null, correctCount: number | null): number | null {
  if (allCount === null || correctCount === null) {
    return null;
  }
  return allCount - correctCount;
}

export function toSolutionItem(item: BackendSolutionItem): SolutionListItem {
  let taskName = "Задача удалена";
  let category = "";
  if (item.task) {
    taskName = item.task.name;
    category = item.task.category;
  }
  return {
    id: item.id,
    taskName: taskName,
    category: category,
    isCorrect: item.isCorrect,
    isGraph: item.__typename !== "SolutionImplementation",
  };
}

export function emptySolutionsText(filter: SolutionFilter): string {
  if (filter === "correct") {
    return "Верных решений пока нет.";
  }
  if (filter === "wrong") {
    return "Неверных решений нет.";
  }
  return "Вы ещё не решали задачи. Выберите задачу в разделе «Задачи».";
}

export function loadSolutionsErrorText(error: unknown): string {
  if (error instanceof ApolloError && error.networkError) {
    return "Нет связи с сервером.";
  }
  return "Не получилось загрузить решения.";
}
