import { ref, shallowRef } from "vue";
import { apolloClient } from "@/shared/api";
import { GetMySolutionsQuery } from "../api/getSolutions";
import {
  filterToCorrect,
  keepForFilter,
  toSolutionItem,
  wrongCount,
  type SolutionFilter,
  type SolutionListItem,
} from "./solutionList";

export const PAGE_SIZE = 20;

export function useSolutionList() {
  const solutions = ref<SolutionListItem[]>([]);
  const totalCount = ref<number | null>(null);
  const hasNext = ref(false);
  const loading = ref(false);
  const error = shallowRef<unknown>(null);
  let nextPage = 0;
  let lastRequest = 0;

  async function countCorrect(authorId: string): Promise<number | null> {
    const { data } = await apolloClient.query({
      query: GetMySolutionsQuery,
      variables: { authorId: authorId, isCorrect: true, page: 0, pageSize: 1 },
      fetchPolicy: "network-only",
    });
    return data.getAllTaskSolutions.pagination?.totalCount ?? null;
  }

  async function loadPage(authorId: string, filter: SolutionFilter, page: number) {
    lastRequest = lastRequest + 1;
    const request = lastRequest;
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apolloClient.query({
        query: GetMySolutionsQuery,
        variables: {
          authorId: authorId,
          isCorrect: filterToCorrect(filter),
          page: page,
          pageSize: PAGE_SIZE,
        },
        fetchPolicy: "network-only",
      });
      let correctCount: number | null = null;
      if (filter === "wrong" && page === 0) {
        correctCount = await countCorrect(authorId);
      }
      if (request !== lastRequest) {
        return;
      }
      const items: SolutionListItem[] = [];
      for (const item of data.getAllTaskSolutions.items ?? []) {
        const solution = toSolutionItem(item);
        if (keepForFilter(solution, filter)) {
          items.push(solution);
        }
      }
      if (page === 0) {
        solutions.value = items;
      } else {
        solutions.value = solutions.value.concat(items);
      }
      const pagination = data.getAllTaskSolutions.pagination;
      hasNext.value = pagination?.hasNext === true;
      const allCount = pagination?.totalCount ?? null;
      if (filter !== "wrong") {
        totalCount.value = allCount;
      } else if (page === 0) {
        totalCount.value = wrongCount(allCount, correctCount);
      }
      nextPage = page + 1;
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

  function search(authorId: string, filter: SolutionFilter) {
    return loadPage(authorId, filter, 0);
  }

  function loadMore(authorId: string, filter: SolutionFilter) {
    return loadPage(authorId, filter, nextPage);
  }

  return { solutions, totalCount, hasNext, loading, error, search, loadMore };
}
