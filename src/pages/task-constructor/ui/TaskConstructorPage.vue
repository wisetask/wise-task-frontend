<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
  draftTabs,
  graphForRules,
  type ConstructorTab,
} from "../model/taskDraft";

const draft = ref(createTaskDraft());
const activeTab = ref<ConstructorTab>("main");
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);

const tabs = computed(() => draftTabs(draft.value));
const problems = computed(() => draftProblems(draft.value));

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

function onDirectionChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  draft.value.rules = withDirection(draft.value.rules, select.value as GraphDirection);
}
</script>

<template>
  <main class="constructor">
    <header class="constructor__header">
      <h1 class="constructor__title">Новая задача</h1>
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
      <UiButton
        variant="primary"
        size="sm"
        class="constructor__save"
        disabled
        title="Сохранение появится, когда подключим вход"
      >
        Создать задачу
      </UiButton>
    </header>

    <section
      v-if="activeTab === 'main'"
      id="constructor-panel-main"
      class="constructor__panel constructor__panel--form"
      role="tabpanel"
      aria-labelledby="constructor-tab-main"
    >
      <div class="constructor__form">
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

        <div v-if="problems.length > 0" class="constructor__problems">
          <p class="constructor__problems-title">Чтобы сохранить задачу:</p>
          <ul class="constructor__problems-list">
            <li v-for="problem in problems" :key="problem">{{ problem }}</li>
          </ul>
        </div>
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

.constructor__title {
  margin: 0;
  font-size: var(--font-size-lg);
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

.constructor__save {
  margin-left: auto;
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

.constructor__problems {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  font-size: var(--font-size-md);
}

.constructor__problems-title {
  margin: 0 0 var(--space-1);
  font-weight: 500;
}

.constructor__problems-list {
  margin: 0;
  padding-left: var(--space-5);
  color: var(--color-text-muted);
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
