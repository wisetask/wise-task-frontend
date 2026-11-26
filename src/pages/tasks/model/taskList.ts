import { ApolloError } from "@apollo/client/core";

export interface TaskFilter {
  name: string;
  category: string;
}

export interface TaskListItem {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  isPublic: boolean;
}

export interface BackendTaskItem {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  author?: { firstName: string; lastName: string } | null;
}

export const DESCRIPTION_LENGTH = 160;

export function emptyFilter(): TaskFilter {
  return { name: "", category: "" };
}

export function isFilterEmpty(filter: TaskFilter): boolean {
  return filter.name.trim() === "" && filter.category.trim() === "";
}

export function filterValue(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  return trimmed;
}

export function shortDescription(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= DESCRIPTION_LENGTH) {
    return oneLine;
  }
  let cut = oneLine.slice(0, DESCRIPTION_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > DESCRIPTION_LENGTH / 2) {
    cut = cut.slice(0, lastSpace);
  }
  return cut + "…";
}

export function authorName(author: BackendTaskItem["author"]): string {
  if (!author) {
    return "";
  }
  return (author.lastName + " " + author.firstName).trim();
}

export function toListItem(item: BackendTaskItem): TaskListItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: shortDescription(item.description),
    author: authorName(item.author),
    isPublic: item.isPublic,
  };
}

export function emptyListText(filter: TaskFilter): string {
  if (isFilterEmpty(filter)) {
    return "Задач пока нет.";
  }
  return "По этому запросу задач не нашлось. Попробуйте изменить название или категорию.";
}

export function loadErrorText(error: unknown): string {
  if (error instanceof ApolloError && error.networkError) {
    return "Нет связи с сервером.";
  }
  return "Не получилось загрузить задачи.";
}
