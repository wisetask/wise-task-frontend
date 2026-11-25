<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { setDirected } from "@/entities/graph";
import { UiButton, UiCheckbox, UiTextArea, UiTextField } from "@/shared/ui";
import {
  DIRECTION_TITLES,
  DIRECTIONS,
  GraphEditor,
  GraphRulesForm,
  withDirection,
  type GraphDirection,
} from "@/widgets/graph-editor";
import {
  createTaskDraft,
  draftProblems,
  draftReadiness,
  draftTabs,
  graphForRules,
  studentHints,
  studentRules,
  studentStartGraph,
  type ConstructorTab,
} from "../model/taskDraft";
import { browserStorage, clearDraft, loadDraft, saveDraft } from "../lib/savedDraft";

const storage = browserStorage();
const savedDraft = loadDraft(storage);
const draft = ref(savedDraft === null ? createTaskDraft() : savedDraft);
const isSaving = ref(storage !== null);
const isClearing = ref(false);
const activeTab = ref<ConstructorTab>("main");
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);

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
const canPickTrialDirection = computed(() => {
  return !draft.value.hasGraph && draft.value.rules.direction === "any";
});

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

function startOver() {
  clearDraft(storage);
  draft.value = createTaskDraft();
  activeTab.value = "main";
  isClearing.value = false;
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
          disabled
          title="Сохранение появится, когда подключим вход"
        >
          Создать задачу
        </UiButton>
      </div>
    </header>

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
              Студент получит готовый граф. Нарисовать его и решить, что с ним можно делать, — на
              вкладке «Граф».
            </p>
            <UiCheckbox v-model="draft.isHiddenMistake" label="Показывать только первую ошибку" />
            <p class="constructor__hint">
              Если решение не прошло несколько проверок, студент увидит только первую.
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
        <GraphRulesForm v-model="draft.rules" :show-direction="false" />
      </div>
      <GraphEditor ref="editor" v-model:graph="draft.graph" class="constructor__editor" />
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
          <UiCheckbox
            v-if="canPickTrialDirection"
            :model-value="trialGraph.isDirected"
            label="Ориентированный граф"
            @update:model-value="onTrialDirectedChange"
          />
          <UiButton
            variant="primary"
            disabled
            title="Проверка появится вместе с сохранением задачи"
          >
            Проверить решение
          </UiButton>
        </aside>
        <GraphEditor
          :key="trialKey"
          v-model:graph="trialGraph"
          :rules="trialRules"
          class="constructor__editor"
        />
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
  width: 300px;
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
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
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
