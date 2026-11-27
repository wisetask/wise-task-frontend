export const CONDITION_OPEN_KEY = "wisetask.task.conditionOpen";

export function readConditionOpen(): boolean {
  try {
    return window.localStorage.getItem(CONDITION_OPEN_KEY) !== "no";
  } catch {
    return true;
  }
}

export function storeConditionOpen(open: boolean) {
  try {
    window.localStorage.setItem(CONDITION_OPEN_KEY, open ? "yes" : "no");
  } catch {
    return;
  }
}
