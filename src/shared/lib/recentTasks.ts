export const RECENT_TASKS_KEY = "wisetask.recentTasks";
export const RECENT_TASKS_LIMIT = 6;

export interface RecentTask {
  id: string;
  name: string;
}

export function parseRecentTasks(text: string | null): RecentTask[] {
  if (text === null) {
    return [];
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  const result: RecentTask[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const id: unknown = item.id;
    const name: unknown = item.name;
    if (typeof id === "string" && typeof name === "string" && id !== "") {
      result.push({ id: id, name: name });
    }
  }
  return result.slice(0, RECENT_TASKS_LIMIT);
}

export function withRecentTask(list: RecentTask[], task: RecentTask): RecentTask[] {
  const result: RecentTask[] = [{ id: task.id, name: task.name }];
  for (const item of list) {
    if (item.id !== task.id) {
      result.push(item);
    }
  }
  return result.slice(0, RECENT_TASKS_LIMIT);
}

export function readRecentTasks(): RecentTask[] {
  try {
    return parseRecentTasks(window.localStorage.getItem(RECENT_TASKS_KEY));
  } catch {
    return [];
  }
}

export function rememberRecentTask(task: RecentTask) {
  try {
    const list = withRecentTask(readRecentTasks(), task);
    window.localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(list));
  } catch {
    return;
  }
}

export function forgetRecentTasks() {
  try {
    window.localStorage.removeItem(RECENT_TASKS_KEY);
  } catch {
    return;
  }
}
