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
  fullDescription: string;
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
    fullDescription: item.description.trim(),
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

export interface TextPart {
  text: string;
  match: boolean;
}

export function highlightParts(text: string, query: string): TextPart[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return [{ text: text, match: false }];
  }
  const parts: TextPart[] = [];
  const lower = text.toLowerCase();
  let position = 0;
  let found = lower.indexOf(needle, position);
  while (found !== -1) {
    if (found > position) {
      parts.push({ text: text.slice(position, found), match: false });
    }
    parts.push({ text: text.slice(found, found + needle.length), match: true });
    position = found + needle.length;
    found = lower.indexOf(needle, position);
  }
  if (position < text.length) {
    parts.push({ text: text.slice(position), match: false });
  }
  return parts;
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

export function foundText(count: number): string {
  return "Найдено " + count + " " + plural(count, "задача", "задачи", "задач");
}

export function popularCategories(tasks: TaskListItem[], limit: number): string[] {
  const counts: Record<string, number> = {};
  const order: string[] = [];
  for (const task of tasks) {
    const category = task.category.trim();
    if (category === "") {
      continue;
    }
    if (counts[category] === undefined) {
      counts[category] = 0;
      order.push(category);
    }
    counts[category] = counts[category] + 1;
  }
  order.sort((first, second) => counts[second] - counts[first]);
  return order.slice(0, limit);
}

export function filterFromQuery(query: Record<string, unknown>): TaskFilter {
  const name = typeof query.q === "string" ? query.q : "";
  const category = typeof query.category === "string" ? query.category : "";
  return { name: name, category: category };
}

export function queryFromFilter(filter: TaskFilter): Record<string, string> {
  const query: Record<string, string> = {};
  if (filter.name.trim() !== "") {
    query.q = filter.name.trim();
  }
  if (filter.category.trim() !== "") {
    query.category = filter.category.trim();
  }
  return query;
}
