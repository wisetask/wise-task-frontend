import { ref } from "vue";
import type { DayActivity } from "../lib/activityCalendar";

export function useActivity() {
  const days = ref<DayActivity[]>([]);
  const available = false;
  return { days: days, available: available };
}
