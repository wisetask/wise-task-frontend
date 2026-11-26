<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { UiButton, UiCheckbox } from "@/shared/ui";
import { GraphEditor } from "@/widgets/graph-editor";
import {
  canPickDirection,
  CheckResultNotice,
  startAnswer,
  TaskCondition,
  taskHints,
} from "@/widgets/task-view";
import { isTaskMissing, loadTaskErrorText, solveErrorText } from "../model/errors";
import { useSolve } from "../model/useSolve";
import { useTask } from "../model/useTask";

const route = useRoute();
const { view, isUnsupported, loading, error, load } = useTask();
const { checking, result, error: checkError, check, clear } = useSolve();

const answer = ref<Graph>(createEmptyGraph(false));
const answerKey = ref(0);

const taskId = computed(() => String(route.params.id));
const hints = computed(() => (view.value === null ? [] : taskHints(view.value)));
const canPick = computed(() => view.value !== null && canPickDirection(view.value));
const checkErrorText = computed(() => {
  if (checkError.value === null) {
    return "";
  }
  return solveErrorText(checkError.value);
});

watch(taskId, (id) => load(id), { immediate: true });

watch(view, () => {
  restartAnswer();
});

watch(answer, () => {
  clear();
});

function restartAnswer() {
  if (view.value === null) {
    return;
  }
  answer.value = startAnswer(view.value);
  answerKey.value = answerKey.value + 1;
}

function onDirectedChange(isDirected: boolean) {
  answer.value = setDirected(answer.value, isDirected);
}

function onCheck() {
  if (view.value === null) {
    return;
  }
  check(view.value, answer.value);
}
</script>

<template>
  <main class="task-page">
    <nav class="task-page__crumbs" aria-label="Путь">
      <RouterLink :to="{ name: 'tasks' }">Задачи</RouterLink>
      <span v-if="view !== null" aria-hidden="true">/</span>
      <span v-if="view !== null" class="task-page__crumb-current">{{ view.name }}</span>
    </nav>

    <p v-if="loading" class="task-page__message">Загружаю задачу…</p>
    <div
      v-else-if="error !== null"
      class="task-page__message task-page__message--error"
      role="alert"
    >
      <span>{{ loadTaskErrorText(error) }}</span>
      <RouterLink v-if="isTaskMissing(error)" :to="{ name: 'tasks' }">К списку задач</RouterLink>
      <UiButton v-else size="sm" @click="load(taskId)">Повторить</UiButton>
    </div>
    <p v-else-if="isUnsupported" class="task-page__message">
      Это задача на написание кода. Такие задачи новый сайт пока не открывает.
    </p>

    <div v-else-if="view !== null" class="task-page__body">
      <TaskCondition :view="view" :hints="hints" />

      <section class="task-page__answer" aria-labelledby="task-page-answer-title">
        <div class="task-page__answer-bar">
          <h2 id="task-page-answer-title" class="task-page__section-title">Ваш ответ</h2>
          <UiCheckbox
            v-if="canPick"
            :model-value="answer.isDirected"
            label="Ориентированный граф"
            @update:model-value="onDirectedChange"
          />
          <UiButton size="sm" class="task-page__restart" @click="restartAnswer">
            Начать заново
          </UiButton>
          <UiButton variant="primary" size="sm" :loading="checking" @click="onCheck">
            Проверить решение
          </UiButton>
        </div>
        <CheckResultNotice v-if="result !== null" :result="result" />
        <p v-else-if="checkErrorText !== ''" class="task-page__check-error" role="alert">
          {{ checkErrorText }}
        </p>
        <GraphEditor
          :key="answerKey"
          v-model:graph="answer"
          :rules="view.rules"
          class="task-page__editor"
        />
      </section>
    </div>
  </main>
</template>

<style scoped>
.task-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-page__crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}

.task-page__crumb-current {
  overflow: hidden;
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-page__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) auto;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.task-page__message--error {
  border-style: solid;
  background: var(--graph-red-fill);
  color: var(--color-text);
}

.task-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.task-page__section-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.task-page__answer {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.task-page__answer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.task-page__restart {
  margin-left: auto;
}

.task-page__check-error {
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--graph-red-fill);
  font-size: var(--font-size-md);
}

.task-page__editor {
  flex: 1;
  min-height: 0;
}
</style>
