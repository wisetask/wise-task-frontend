import { ref } from "vue";
import { apolloClient } from "@/shared/api";
import { GetMyTaskMarksQuery } from "../api/getMyMarks";
import { taskMarks, type SolutionMarkItem, type TaskMark } from "./taskMarks";

export const MARKS_PAGE_SIZE = 100;
export const MARKS_MAX_PAGES = 10;

export function useTaskMarks() {
  const marks = ref<Record<string, TaskMark>>({});
  let loadedFor = "";

  async function load(authorId: string) {
    if (authorId === "" || loadedFor === authorId) {
      return;
    }
    loadedFor = authorId;
    const items: SolutionMarkItem[] = [];
    try {
      for (let page = 0; page < MARKS_MAX_PAGES; page++) {
        const { data } = await apolloClient.query({
          query: GetMyTaskMarksQuery,
          variables: { authorId: authorId, page: page, pageSize: MARKS_PAGE_SIZE },
          fetchPolicy: "network-only",
        });
        const response = data.getAllTaskSolutions;
        for (const item of response.items ?? []) {
          items.push({ isCorrect: item.isCorrect, task: item.task });
        }
        marks.value = taskMarks(items);
        if (response.pagination?.hasNext !== true) {
          break;
        }
      }
    } catch {
      return;
    }
  }

  return { marks, load };
}
