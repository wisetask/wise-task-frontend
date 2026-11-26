<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { UiButton } from "@/shared/ui";
import { GraphCanvas } from "@/widgets/graph-editor";
import { CheckResultNotice, TaskCondition } from "@/widgets/task-view";
import { isSolutionMissing, loadSolutionErrorText } from "../model/errors";
import { useSolution } from "../model/useSolution";

const route = useRoute();
const { view, answer, result, isUnsupported, loading, error, load } = useSolution();

const solutionId = computed(() => String(route.params.id));

watch(solutionId, (id) => load(id), { immediate: true });
</script>

<template>
  <main class="solution-page">
    <nav class="solution-page__crumbs" aria-label="Путь">
      <RouterLink :to="{ name: 'solutions' }">Мои решения</RouterLink>
      <span v-if="view !== null" aria-hidden="true">/</span>
      <span v-if="view !== null" class="solution-page__crumb-current">{{ view.name }}</span>
    </nav>

    <p v-if="loading" class="solution-page__message">Загружаю решение…</p>
    <div
      v-else-if="error !== null"
      class="solution-page__message solution-page__message--error"
      role="alert"
    >
      <span>{{ loadSolutionErrorText(error) }}</span>
      <RouterLink v-if="isSolutionMissing(error)" :to="{ name: 'solutions' }">
        К моим решениям
      </RouterLink>
      <UiButton v-else size="sm" @click="load(solutionId)">Повторить</UiButton>
    </div>
    <p v-else-if="isUnsupported" class="solution-page__message">
      Это решение задачи на написание кода или задачи, которой больше нет. Такие решения новый сайт
      пока не открывает.
    </p>

    <div v-else-if="view !== null" class="solution-page__body">
      <TaskCondition :view="view" :hints="[]" />

      <section class="solution-page__answer" aria-labelledby="solution-page-answer-title">
        <div class="solution-page__answer-bar">
          <h2 id="solution-page-answer-title" class="solution-page__title">Ваше решение</h2>
          <RouterLink class="solution-page__again" :to="{ name: 'task', params: { id: view.id } }">
            Решить ещё раз
          </RouterLink>
        </div>
        <CheckResultNotice
          v-if="result !== null"
          :result="result"
          success-text="Решение верное: все проверки пройдены."
          failure-text="Решение неверное:"
        />
        <div v-if="answer !== null" class="solution-page__canvas">
          <GraphCanvas :graph="answer" readonly />
        </div>
        <p v-else class="solution-page__message">Граф решения не нашёлся на сервере.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.solution-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.solution-page__crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}

.solution-page__crumb-current {
  overflow: hidden;
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.solution-page__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) auto;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.solution-page__message--error {
  border-style: solid;
  background: var(--graph-red-fill);
  color: var(--color-text);
}

.solution-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.solution-page__answer {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.solution-page__answer-bar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.solution-page__title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.solution-page__again {
  margin-left: auto;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--font-size-md);
  text-decoration: none;
}

.solution-page__again:hover {
  background: var(--color-accent-hover);
}

.solution-page__again:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.solution-page__canvas {
  flex: 1;
  min-height: 0;
}
</style>
