import { ref, shallowRef } from "vue";
import { apolloClient } from "@/shared/api";
import { GetMySolutionsQuery } from "../api/getSolutions";
import { toSolutionItem, type SolutionListItem } from "./solutionList";

export const PAGE_SIZE = 100;
export const MAX_PAGES = 10;

export function useSolutionList() {
  const solutions = shallowRef<SolutionListItem[]>([]);
  const loading = ref(false);
  const error = shallowRef<unknown>(null);
  const cut = ref(false);
  let lastRequest = 0;

  async function load(authorId: string) {
    lastRequest = lastRequest + 1;
    const request = lastRequest;
    loading.value = true;
    error.value = null;
    cut.value = false;
    const items: SolutionListItem[] = [];
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const { data } = await apolloClient.query({
          query: GetMySolutionsQuery,
          variables: { authorId: authorId, isCorrect: null, page: page, pageSize: PAGE_SIZE },
          fetchPolicy: "network-only",
        });
        if (request !== lastRequest) {
          return;
        }
        const response = data.getAllTaskSolutions;
        for (const item of response.items ?? []) {
          items.push(toSolutionItem(item));
        }
        solutions.value = items.slice();
        if (response.pagination?.hasNext !== true) {
          break;
        }
        if (page === MAX_PAGES - 1) {
          cut.value = true;
        }
      }
    } catch (caught) {
      if (request === lastRequest) {
        error.value = caught;
      }
    } finally {
      if (request === lastRequest) {
        loading.value = false;
      }
    }
  }

  return { solutions, loading, error, cut, load };
}
