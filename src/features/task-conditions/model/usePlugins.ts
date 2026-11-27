import { useQuery } from "@vue/apollo-composable";
import {
  computed,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import type { GetTaskConditionPluginsQuery } from "@/shared/api/generated/graphql";
import { GetTaskConditionPlugins } from "../api/getAllPlugins";
import type { Plugin } from "./plugin";

export function usePlugins(enabled: MaybeRefOrGetter<boolean> = true) {
  const pageSize = 50;
  const query = useQuery(GetTaskConditionPlugins, { page: 0, pageSize }, () => ({
    enabled: toValue(enabled),
  }));

  const plugins = shallowRef<Plugin[]>([]);
  const loadingPages = ref(false);
  const paginationError = shallowRef<Error | null>(null);
  let started = false;
  let disposed = false;
  onScopeDispose(() => {
    disposed = true;
  });

  async function loadPages(result: GetTaskConditionPluginsQuery) {
    const firstPage = result.getAllPlugins;
    plugins.value = firstPage.items ?? [];

    if (firstPage.pagination?.hasNext !== true) return;

    loadingPages.value = true;
    try {
      let page = 1;
      let hasNext = true;

      while (hasNext && !disposed) {
        const response = await query.fetchMore({
          variables: { page, pageSize },
        });
        if (disposed || !response) break;

        const nextPage = response.data.getAllPlugins;
        plugins.value = [...plugins.value, ...(nextPage.items ?? [])];
        hasNext = nextPage.pagination?.hasNext === true;
        page += 1;
      }
    } catch (error) {
      paginationError.value = error instanceof Error ? error : new Error(String(error));
    } finally {
      loadingPages.value = false;
    }
  }

  watch(
    query.result,
    (result) => {
      if (!result || started) return;
      started = true;
      void loadPages(result);
    },
    { immediate: true },
  );

  async function retry() {
    paginationError.value = null;
    started = true;
    try {
      const response = await query.refetch();
      if (response && !disposed) {
        await loadPages(response.data);
      }
    } catch (error) {
      paginationError.value = error instanceof Error ? error : new Error(String(error));
    }
  }

  return {
    plugins,
    loading: computed(() => query.loading.value || loadingPages.value),
    error: computed(() => query.error.value ?? paginationError.value),
    retry,
  };
}
