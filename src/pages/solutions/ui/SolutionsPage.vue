<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useUserStore } from "@/entities/user";
import { UiButton } from "@/shared/ui";
import {
  emptySolutionsText,
  FILTER_TITLES,
  loadSolutionsErrorText,
  SOLUTION_FILTERS,
  type SolutionFilter,
} from "../model/solutionList";
import { useSolutionList } from "../model/useSolutionList";

const userStore = useUserStore();
const { solutions, totalCount, hasNext, loading, error, search, loadMore } = useSolutionList();

const filter = ref<SolutionFilter>("all");

const authorId = computed(() => {
  if (userStore.user === null) {
    return "";
  }
  return userStore.user.id;
});

const needsSignIn = computed(() => !userStore.isLoading && userStore.user === null);

watch(
  [authorId, filter],
  () => {
    if (authorId.value !== "") {
      search(authorId.value, filter.value);
    }
  },
  { immediate: true },
);

function onRetry() {
  search(authorId.value, filter.value);
}

function onLoadMore() {
  loadMore(authorId.value, filter.value);
}
</script>

<template>
  <main class="solutions">
    <h1 class="solutions__title">Мои решения</h1>

    <p v-if="needsSignIn" class="solutions__message">
      Решения видны только после входа.
      <RouterLink :to="{ name: 'sign-in', query: { redirect: '/solutions' } }">Войти</RouterLink>
    </p>

    <template v-else>
      <div class="solutions__filters" role="group" aria-label="Какие решения показать">
        <UiButton
          v-for="item in SOLUTION_FILTERS"
          :key="item"
          size="sm"
          :variant="filter === item ? 'primary' : 'secondary'"
          :aria-pressed="filter === item"
          @click="filter = item"
        >
          {{ FILTER_TITLES[item] }}
        </UiButton>
        <span v-if="totalCount !== null && error === null" class="solutions__count">
          Найдено: {{ totalCount }}
        </span>
      </div>

      <div v-if="error !== null" class="solutions__message solutions__message--error" role="alert">
        <span>{{ loadSolutionsErrorText(error) }}</span>
        <UiButton size="sm" @click="onRetry">Повторить</UiButton>
      </div>
      <p v-else-if="loading && solutions.length === 0" class="solutions__message">
        Загружаю решения…
      </p>
      <p v-else-if="solutions.length === 0 && authorId !== ''" class="solutions__message">
        {{ emptySolutionsText(filter) }}
      </p>

      <ul v-if="solutions.length > 0" class="solutions__list">
        <li v-for="solution in solutions" :key="solution.id">
          <RouterLink
            class="solutions__item"
            :to="{ name: 'solution', params: { id: solution.id } }"
          >
            <span class="solutions__task">
              <span v-if="solution.category !== ''" class="solutions__category">
                {{ solution.category }}
              </span>
              <span class="solutions__name">{{ solution.taskName }}</span>
            </span>
            <span
              :class="[
                'solutions__badge',
                solution.isCorrect ? 'solutions__badge--correct' : 'solutions__badge--wrong',
              ]"
            >
              {{ solution.isCorrect ? "Верно" : "Неверно" }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <UiButton
        v-if="hasNext && error === null"
        class="solutions__more"
        :loading="loading"
        @click="onLoadMore"
      >
        Показать ещё
      </UiButton>
    </template>
  </main>
</template>

<style scoped>
.solutions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 880px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
}

.solutions__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.solutions__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.solutions__count {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.solutions__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.solutions__message--error {
  border-style: solid;
  background: var(--graph-red-fill);
  color: var(--color-text);
}

.solutions__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.solutions__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
}

.solutions__item:hover {
  border-color: var(--color-accent);
}

.solutions__item:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.solutions__task {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.solutions__category {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.solutions__name {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.solutions__badge {
  flex: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.solutions__badge--correct {
  background: var(--graph-green-fill);
}

.solutions__badge--wrong {
  background: var(--graph-red-fill);
}

.solutions__more {
  align-self: center;
}
</style>
