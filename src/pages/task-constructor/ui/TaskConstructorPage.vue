<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { setDirected } from "@/entities/graph";
import { useUserStore } from "@/entities/user";
import { UiButton, UiCheckbox, UiTextArea, UiTextField } from "@/shared/ui";
import {
  DIRECTION_TITLES,
  DIRECTIONS,
  GraphCanvas,
  GraphEditor,
  GraphRulesForm,
  withDirection,
  type GraphDirection,
} from "@/widgets/graph-editor";
import {
  canPickAnswerDirection,
  createTaskDraft,
  draftProblems,
  draftReadiness,
  draftTabs,
  graphForRules,
  studentHints,
  studentRules,
  studentStartGraph,
  taskGraph,
  type ConstructorTab,
} from "../model/taskDraft";
import { useCreateTask, type CreatedTask } from "../model/useCreateTask";
import { createErrorMessage } from "../lib/createError";
import { browserStorage, clearDraft, loadDraft, saveDraft } from "../lib/savedDraft";

const storage = browserStorage();
const savedDraft = loadDraft(storage);
const draft = ref(savedDraft === null ? createTaskDraft() : savedDraft);
const isSaving = ref(storage !== null);
const isClearing = ref(false);
const activeTab = ref<ConstructorTab>("main");
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);

const userStore = useUserStore();
const { createTask, loading: isCreating, error: createError } = useCreateTask();
const createdTask = ref<CreatedTask | null>(null);
const shownProblems = ref<string[]>([]);
const needsSignIn = ref(false);
const errorMessage = computed(() => createErrorMessage(createError.value));

const tabs = computed(() => draftTabs(draft.value));
const problems = computed(() => draftProblems(draft.value));
const readiness = computed(() => draftReadiness(draft.value));

const readinessSummary = computed(() => {
  if (problems.value.length === 0) {
    return "Всё заполнено, задачу можно создавать.";
  }
  return "Осталось заполнить: " + problems.value.length + ".";
});

const trialGraph = ref(studentStartGraph(draft.value));
const trialKey = ref(0);
const trialRules = computed(() => studentRules(draft.value));
const trialHints = computed(() => studentHints(draft.value));
const canPickTrialDirection = computed(() => canPickAnswerDirection(draft.value));
const taskPicture = computed(() => taskGraph(draft.value));

const pageTitle = computed(() => {
  const name = draft.value.name.trim();
  return name === "" ? "Новая задача" : name;
});

const saveStatus = computed(() => {
  if (isSaving.value) {
    return "Черновик сохраняется в браузере";
  }
  return "Браузер не даёт сохранить черновик";
});

watch(tabs, (newTabs) => {
  let isShown = false;
  for (const tab of newTabs) {
    if (tab.id === activeTab.value) {
      isShown = true;
    }
  }
  if (!isShown) {
    activeTab.value = "main";
  }
});

watch(
  () => draft.value.rules.direction,
  () => {
    const fixed = graphForRules(draft.value.graph, draft.value.rules);
    if (fixed === draft.value.graph) {
      return;
    }
    if (editor.value !== null) {
      editor.value.replaceGraph(fixed);
    } else {
      draft.value.graph = fixed;
    }
  },
);

watch(problems, (newProblems) => {
  if (shownProblems.value.length > 0) {
    shownProblems.value = newProblems;
  }
});

watch(
  draft,
  (value) => {
    isSaving.value = saveDraft(storage, value);
  },
  { deep: true },
);

watch(activeTab, (tab) => {
  if (tab === "student") {
    restartTrial();
  }
});

function restartTrial() {
  trialGraph.value = studentStartGraph(draft.value);
  trialKey.value = trialKey.value + 1;
}

function onTrialDirectedChange(isDirected: boolean) {
  trialGraph.value = setDirected(trialGraph.value, isDirected);
}

function hideNotices() {
  createdTask.value = null;
  shownProblems.value = [];
  needsSignIn.value = false;
}

function startOver() {
  clearDraft(storage);
  draft.value = createTaskDraft();
  activeTab.value = "main";
  isClearing.value = false;
  hideNotices();
}

async function onCreate() {
  hideNotices();
  if (problems.value.length > 0) {
    shownProblems.value = problems.value;
    activeTab.value = "main";
    return;
  }
  if (!userStore.isLoggedIn) {
    needsSignIn.value = true;
    return;
  }
  const task = await createTask(draft.value);
  if (task === null) {
    return;
  }
  startOver();
  createdTask.value = task;
}

function onDirectionChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  draft.value.rules = withDirection(draft.value.rules, select.value as GraphDirection);
}
</script>

<template>
  <main class="constructor">
    <header class="constructor__header">
      <div class="constructor__heading">
        <h1 class="constructor__title">{{ pageTitle }}</h1>
        <span class="constructor__status">{{ saveStatus }}</span>
      </div>
      <nav class="constructor__tabs" role="tablist" aria-label="Части задачи">
        <button
          v-for="tab in tabs"
          :id="'constructor-tab-' + tab.id"
          :key="tab.id"
          type="button"
          role="tab"
          class="constructor__tab"
          :class="{ 'constructor__tab--active': activeTab === tab.id }"
          :aria-selected="activeTab === tab.id"
          :aria-controls="'constructor-panel-' + tab.id"
          @click="activeTab = tab.id"
        >
          {{ tab.title }}
        </button>
      </nav>
      <div
        v-if="isClearing"
        class="constructor__actions"
        role="group"
        aria-label="Очистка черновика"
      >
        <span class="constructor__confirm">Удалить всё и начать заново?</span>
        <UiButton variant="danger" size="sm" @click="startOver">Да, очистить</UiButton>
        <UiButton size="sm" @click="isClearing = false">Отмена</UiButton>
      </div>
      <div v-else class="constructor__actions">
        <UiButton size="sm" @click="isClearing = true">Очистить черновик</UiButton>
        <UiButton
          variant="primary"
          size="sm"
          class="constructor__save"
          :loading="isCreating"
          @click="onCreate"
        >
          Создать задачу
        </UiButton>
      </div>
    </header>

    <p
      v-if="createdTask !== null"
      class="constructor__notice constructor__notice--success"
      role="status"
    >
      Задача «{{ createdTask.name }}» создана. Черновик очищен, можно собирать следующую.
    </p>
    <div
      v-else-if="shownProblems.length > 0"
      class="constructor__notice constructor__notice--error"
      role="alert"
    >
      <span>Чтобы создать задачу, осталось:</span>
      <ul class="constructor__notice-list">
        <li v-for="problem in shownProblems" :key="problem">{{ problem }}</li>
      </ul>
    </div>
    <p v-else-if="needsSignIn" class="constructor__notice constructor__notice--error" role="alert">
      Создавать задачи можно только после входа. Черновик сохранится.
      <RouterLink :to="{ name: 'sign-in', query: { redirect: '/constructor' } }">Войти</RouterLink>
    </p>
    <p
      v-else-if="errorMessage !== ''"
      class="constructor__notice constructor__notice--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <section
      v-if="activeTab === 'main'"
      id="constructor-panel-main"
      class="constructor__panel constructor__panel--form"
      role="tabpanel"
      aria-labelledby="constructor-tab-main"
    >
      <div class="constructor__columns">
        <div class="constructor__form constructor__form--main">
          <UiTextField v-model="draft.name" label="Название" required />
          <UiTextField
            v-model="draft.category"
            label="Категория"
            hint="Например, «Деревья» или «Раскраска»"
            required
          />
          <UiTextArea
            v-model="draft.description"
            label="Описание"
            hint="Что нужно сделать студенту. Это он увидит первым."
            :rows="5"
            required
          />

          <label class="constructor__select-field">
            <span class="constructor__select-label">Вид графа</span>
            <select
              class="constructor__select"
              :value="draft.rules.direction"
              @change="onDirectionChange"
            >
              <option v-for="direction in DIRECTIONS" :key="direction" :value="direction">
                {{ DIRECTION_TITLES[direction] }}
              </option>
            </select>
            <span class="constructor__hint">
              Если граф задан, он сразу станет такого вида. Если граф рисует студент, другой вид он
              выбрать не сможет.
            </span>
          </label>

          <div class="constructor__checks">
            <UiCheckbox v-model="draft.hasGraph" label="Граф задан" />
            <p class="constructor__hint">
              Граф будет в условии, а ответ студента начнётся с копии этого графа. Нарисовать граф и
              решить, что студент может делать с копией, — на вкладке «Граф».
            </p>
            <UiCheckbox v-model="draft.isPublic" label="Публичная задача" />
          </div>
        </div>

        <aside class="constructor__readiness" aria-labelledby="constructor-readiness-title">
          <h2 id="constructor-readiness-title" class="constructor__readiness-title">
            Готовность задачи
          </h2>
          <ul class="constructor__readiness-list">
            <li
              v-for="item in readiness"
              :key="item.text"
              class="constructor__readiness-item"
              :class="{ 'constructor__readiness-item--done': item.isDone }"
            >
              <svg
                v-if="item.isDone"
                class="constructor__readiness-icon"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M3 8.5 L6.5 12 L13 4.5" />
              </svg>
              <svg
                v-else
                class="constructor__readiness-icon"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="5.5" />
              </svg>
              <span>{{ item.text }}</span>
            </li>
          </ul>
          <p class="constructor__readiness-summary">
            {{ readinessSummary }}
          </p>
        </aside>
      </div>
    </section>

    <section
      v-else-if="activeTab === 'graph'"
      id="constructor-panel-graph"
      class="constructor__panel constructor__panel--graph"
      role="tabpanel"
      aria-labelledby="constructor-tab-graph"
    >
      <div class="constructor__rules">
        <GraphRulesForm
          v-model="draft.rules"
          :show-direction="false"
          title="В своём ответе студент может:"
        />
        <p class="constructor__rules-hint">
          Этот граф студент увидит в условии без изменений, а свой ответ начнёт с его копии. Галочки
          задают, что можно делать с копией.
        </p>
      </div>
      <GraphEditor ref="editor" v-model:graph="draft.graph" class="constructor__editor" analysis />
    </section>

    <section
      v-else-if="activeTab === 'student'"
      id="constructor-panel-student"
      class="constructor__panel constructor__panel--student"
      role="tabpanel"
      aria-labelledby="constructor-tab-student"
    >
      <div class="constructor__trial-bar">
        <span class="constructor__trial-title">Так задачу увидит студент.</span>
        <span>Решайте как студент: правила работают по-настоящему, а черновик не меняется.</span>
        <UiButton size="sm" class="constructor__trial-restart" @click="restartTrial">
          Начать заново
        </UiButton>
      </div>
      <div class="constructor__trial">
        <aside class="constructor__task">
          <span v-if="draft.category.trim() !== ''" class="constructor__task-category">
            {{ draft.category }}
          </span>
          <h2 class="constructor__task-name">{{ pageTitle }}</h2>
          <p v-if="draft.description.trim() !== ''" class="constructor__task-description">
            {{ draft.description }}
          </p>
          <p v-else class="constructor__hint">Описание пока не заполнено.</p>
          <ul v-if="trialHints.length > 0" class="constructor__task-hints">
            <li v-for="hint in trialHints" :key="hint">{{ hint }}</li>
          </ul>
          <section
            v-if="taskPicture !== null"
            class="constructor__task-graph"
            aria-labelledby="constructor-task-graph-title"
          >
            <h3 id="constructor-task-graph-title" class="constructor__task-graph-title">
              Граф задачи
            </h3>
            <p v-if="taskPicture.vertices.length === 0" class="constructor__hint">
              Граф пока пустой: нарисуйте его на вкладке «Граф».
            </p>
            <div v-else class="constructor__task-canvas">
              <GraphCanvas :graph="taskPicture" readonly />
            </div>
          </section>
        </aside>
        <section class="constructor__answer" aria-labelledby="constructor-answer-title">
          <div class="constructor__answer-bar">
            <h2 id="constructor-answer-title" class="constructor__answer-title">Ваш ответ</h2>
            <UiCheckbox
              v-if="canPickTrialDirection"
              :model-value="trialGraph.isDirected"
              label="Ориентированный граф"
              @update:model-value="onTrialDirectedChange"
            />
            <UiButton
              variant="primary"
              size="sm"
              class="constructor__check"
              disabled
              title="Проверка появится вместе с сохранением задачи"
            >
              Проверить решение
            </UiButton>
          </div>
          <GraphEditor
            :key="trialKey"
            v-model:graph="trialGraph"
            :rules="trialRules"
            class="constructor__editor"
          />
        </section>
      </div>
    </section>

    <section
      v-else
      id="constructor-panel-conditions"
      class="constructor__panel constructor__panel--form"
      role="tabpanel"
      aria-labelledby="constructor-tab-conditions"
    >
      <div class="constructor__form">
        <p class="constructor__empty">
          Здесь будут проверки решения: какой плагин запустить, с чем сравнить результат и какую
          ошибку показать студенту.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.constructor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.constructor__header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.constructor__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: var(--space-2) 0;
}

.constructor__title {
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-lg);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.constructor__status {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.constructor__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.constructor__confirm {
  font-size: var(--font-size-md);
  white-space: nowrap;
}

.constructor__tabs {
  display: flex;
  align-self: stretch;
  gap: var(--space-1);
}

.constructor__tab {
  padding: var(--space-3) var(--space-3);
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-md);
  cursor: pointer;
}

.constructor__tab:hover {
  color: var(--color-text);
}

.constructor__tab--active {
  border-bottom-color: var(--color-accent);
  color: var(--color-text);
  font-weight: 600;
}

.constructor__tab:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.constructor__notice {
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-md);
}

.constructor__notice--success {
  background: var(--graph-green-fill);
}

.constructor__notice--error {
  background: var(--graph-red-fill);
}

.constructor__notice-list {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-5);
}

.constructor__panel {
  flex: 1;
  min-height: 0;
}

.constructor__panel--form {
  overflow-y: auto;
  padding: var(--space-5) var(--space-4);
}

.constructor__panel--graph {
  display: flex;
  flex-direction: column;
}

.constructor__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 640px;
  margin: 0 auto;
}

.constructor__select-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.constructor__select-label {
  font-size: var(--font-size-md);
  font-weight: 500;
}

.constructor__select {
  align-self: flex-start;
  height: var(--control-height-md);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.constructor__select:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -1px;
}

.constructor__checks {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}

.constructor__hint {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__columns {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-6);
}

.constructor__form--main {
  flex: 999 1 480px;
  min-width: 0;
  margin: 0;
}

.constructor__readiness {
  flex: 1 1 240px;
  max-width: 320px;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.constructor__readiness-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.constructor__readiness-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.constructor__readiness-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.constructor__readiness-item--done {
  color: var(--color-text);
}

.constructor__readiness-icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 1.5;
}

.constructor__readiness-item--done .constructor__readiness-icon {
  stroke: var(--graph-green-stroke);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.constructor__readiness-summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__panel--student {
  display: flex;
  flex-direction: column;
}

.constructor__trial-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-accent-muted);
  font-size: var(--font-size-md);
}

.constructor__trial-title {
  font-weight: 600;
}

.constructor__trial-restart {
  margin-left: auto;
}

.constructor__trial {
  flex: 1;
  min-height: 0;
  display: flex;
}

.constructor__task {
  flex: none;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}

.constructor__task-category {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__task-name {
  margin: 0;
  font-size: var(--font-size-lg);
}

.constructor__task-description {
  margin: 0;
  line-height: 1.55;
  white-space: pre-line;
}

.constructor__task-hints {
  margin: 0;
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__rules {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-5);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

.constructor__rules-hint {
  flex: 1 1 280px;
  max-width: 420px;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__task-graph {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.constructor__task-graph-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.constructor__task-canvas {
  height: 260px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.constructor__answer {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.constructor__answer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.constructor__answer-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.constructor__check {
  margin-left: auto;
}

.constructor__editor {
  flex: 1;
  min-height: 0;
}

.constructor__empty {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
