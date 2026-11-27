<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  findEdge,
  findVertex,
  updateEdge,
  updateVertex,
  type Graph,
  type GraphColor,
  type VertexChanges,
} from "@/entities/graph";
import { UiButton, UiTextField } from "@/shared/ui";
import { ALIGN_KINDS, ALIGN_TITLES, alignNeeds, alignVertices, type AlignKind } from "../lib/align";
import { colorClass } from "../lib/colors";
import { vertexSummary } from "../lib/contextMenu";
import { createEditSession } from "../lib/editSession";
import { ALGORITHM_KINDS, ALGORITHM_TITLES, type AlgorithmKind } from "../lib/algorithms";
import { graphFacts } from "../lib/graphFacts";
import { describeEdge, describeGroup } from "../lib/labels";
import {
  commonColor,
  paintSelected,
  removeSelected,
  selectedIds,
  type GraphSelection,
} from "../lib/selection";
import { allowEverything, rulesSummary, type EditorRules } from "../lib/rules";
import { parseWeight, weightError } from "../lib/weight";
import GraphColorPicker from "./GraphColorPicker.vue";
import GraphColorSwatches from "./GraphColorSwatches.vue";

const props = withDefaults(
  defineProps<{
    graph: Graph;
    selection: GraphSelection | null;
    rules?: EditorRules;
    analysis?: boolean;
    showDegrees?: boolean;
    showComponents?: boolean;
  }>(),
  {
    rules: () => allowEverything(),
    analysis: false,
    showDegrees: false,
    showComponents: false,
  },
);

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
  "update:showDegrees": [value: boolean];
  "update:showComponents": [value: boolean];
  arrange: [graph: Graph];
  help: [];
  "run-algorithm": [kind: AlgorithmKind];
}>();

const editSession = createEditSession(() => emit("before-change", props.graph));

const vertex = computed(() => {
  if (props.selection === null || props.selection.kind !== "vertex") {
    return undefined;
  }
  return findVertex(props.graph, props.selection.id);
});

const edge = computed(() => {
  if (props.selection === null || props.selection.kind !== "edge") {
    return undefined;
  }
  return findEdge(props.graph, props.selection.id);
});

const group = computed(() => {
  if (props.selection === null || props.selection.kind !== "group") {
    return null;
  }
  return selectedIds(props.selection);
});

const groupColor = computed(() => commonColor(props.graph, props.selection));

const selected = computed(() => {
  if (vertex.value) {
    return vertex.value;
  }
  return edge.value;
});

const ALGORITHM_NOTES: Record<AlgorithmKind, string> = {
  bfs: "волной, по уровням",
  dfs: "вглубь до упора и назад",
  dijkstra: "кратчайшие пути по весам",
  prim: "самый лёгкий остов",
};

const subtitle = computed(() => {
  if (vertex.value) {
    return vertexSummary(props.graph, vertex.value.id);
  }
  if (edge.value) {
    if (edge.value.label === "") {
      return "вес " + edge.value.weight + " · без подписи";
    }
    return "вес " + edge.value.weight;
  }
  return "";
});

function canAlign(kind: AlignKind): boolean {
  if (!props.rules.canMove || group.value === null) {
    return false;
  }
  return group.value.vertexIds.length >= alignNeeds(kind);
}

function onAlign(kind: AlignKind) {
  if (group.value === null) {
    return;
  }
  emit("arrange", alignVertices(props.graph, group.value.vertexIds, kind));
}

function onWeightStep(delta: number) {
  if (!selected.value) {
    return;
  }
  editSession.finish();
  weightProblem.value = "";
  emit("before-change", props.graph);
  changeSelected({ weight: selected.value.weight + delta });
}

const title = computed(() => {
  if (vertex.value) {
    return "Вершина " + vertex.value.label;
  }
  if (edge.value) {
    return describeEdge(props.graph, edge.value);
  }
  if (group.value) {
    return describeGroup(group.value.vertexIds.length, group.value.edgeIds.length);
  }
  return "Граф";
});

function algorithmHint(kind: AlgorithmKind): string {
  if (kind === "prim" && props.graph.isDirected) {
    return "Только для неориентированного графа";
  }
  return "";
}

const facts = computed(() => (props.analysis ? graphFacts(props.graph) : []));

const typeText = computed(() => (props.graph.isDirected ? "ориентированный" : "неориентированный"));

const deleteText = computed(() => {
  if (vertex.value) {
    return "Удалить вершину";
  }
  if (edge.value) {
    return "Удалить ребро";
  }
  return "Удалить выбранное";
});

const weightProblem = ref("");

const limits = computed(() => rulesSummary(props.rules));

const labelPlaceholder = computed(() => (edge.value ? "Например, a" : ""));

watch(
  () => props.selection,
  () => {
    editSession.finish();
    weightProblem.value = "";
  },
);

function fieldKey(field: string): string {
  if (props.selection === null || props.selection.kind === "group") {
    return field;
  }
  return props.selection.kind + ":" + props.selection.id + ":" + field;
}

function changeSelected(changes: VertexChanges) {
  if (vertex.value) {
    emit("update:graph", updateVertex(props.graph, vertex.value.id, changes));
  } else if (edge.value) {
    emit("update:graph", updateEdge(props.graph, edge.value.id, changes));
  }
}

function onLabelInput(text: string) {
  editSession.edit(fieldKey("label"));
  changeSelected({ label: text });
}

function onWeightInput(text: string) {
  weightProblem.value = weightError(text);
  const weight = parseWeight(text);
  if (weight === null) {
    return;
  }
  editSession.edit(fieldKey("weight"));
  changeSelected({ weight: weight });
}

function onColorChange(color: GraphColor) {
  editSession.finish();
  emit("before-change", props.graph);
  changeSelected({ color: color });
}

function onGroupColorChange(color: GraphColor) {
  emit("before-change", props.graph);
  emit("update:graph", paintSelected(props.graph, props.selection, color));
}

function onDeleteClick() {
  emit("before-change", props.graph);
  emit("update:graph", removeSelected(props.graph, props.selection));
  emit("update:selection", null);
}
</script>

<template>
  <aside class="graph-properties">
    <template v-if="selected">
      <div class="graph-properties__hero">
        <span
          class="graph-properties__avatar"
          :class="[
            'graph-properties__avatar--' + colorClass(selected.color),
            { 'graph-properties__avatar--edge': !vertex },
          ]"
          aria-hidden="true"
        >
          <template v-if="vertex">{{ vertex.label }}</template>
          <svg v-else viewBox="0 0 24 24">
            <circle cx="6" cy="17" r="3" />
            <circle cx="18" cy="7" r="3" />
            <path d="M8.5 15 L15.5 9" />
          </svg>
        </span>
        <div class="graph-properties__hero-text">
          <h2 class="graph-properties__title">{{ title }}</h2>
          <p class="graph-properties__subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div class="graph-properties__card">
        <UiTextField
          :key="'label-' + selected.id"
          :model-value="selected.label"
          label="Подпись"
          :placeholder="labelPlaceholder"
          :disabled="!rules.canEditLabels"
          @update:model-value="onLabelInput"
        />
        <div class="graph-properties__field">
          <span class="graph-properties__label">Цвет</span>
          <GraphColorSwatches
            :model-value="selected.color"
            :disabled="!rules.canColor"
            @update:model-value="onColorChange"
          />
        </div>
        <div class="graph-properties__weight">
          <UiTextField
            :key="'weight-' + selected.id"
            class="graph-properties__weight-field"
            :model-value="String(selected.weight)"
            label="Вес"
            inputmode="numeric"
            :error="weightProblem"
            :disabled="!rules.canEditLabels"
            @update:model-value="onWeightInput"
          />
          <div class="graph-properties__stepper">
            <button
              type="button"
              class="graph-properties__step"
              aria-label="Уменьшить вес на 1"
              :disabled="!rules.canEditLabels"
              @click="onWeightStep(-1)"
            >
              −
            </button>
            <button
              type="button"
              class="graph-properties__step"
              aria-label="Увеличить вес на 1"
              :disabled="!rules.canEditLabels"
              @click="onWeightStep(1)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <section v-if="analysis && vertex" class="graph-properties__section">
        <h3 class="graph-properties__heading">Показать по шагам отсюда</h3>
        <div class="graph-properties__algorithms">
          <button
            v-for="kind in ALGORITHM_KINDS"
            :key="kind"
            type="button"
            class="graph-properties__algorithm"
            :disabled="kind === 'prim' && graph.isDirected"
            :title="algorithmHint(kind)"
            @click="emit('run-algorithm', kind)"
          >
            <span class="graph-properties__algorithm-text">
              <span class="graph-properties__algorithm-title">{{ ALGORITHM_TITLES[kind] }}</span>
              <span class="graph-properties__algorithm-note">{{ ALGORITHM_NOTES[kind] }}</span>
            </span>
            <svg class="graph-properties__algorithm-play" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6 L17 12 L9 18 Z" />
            </svg>
          </button>
        </div>
      </section>

      <button
        v-if="rules.canDelete"
        type="button"
        class="graph-properties__delete"
        @click="onDeleteClick"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7 H19 M10 7 V5 H14 V7 M7 7 L8 20 H16 L17 7" />
        </svg>
        {{ deleteText }}
      </button>
    </template>

    <template v-else-if="group">
      <h2 class="graph-properties__title">{{ title }}</h2>
      <GraphColorPicker
        :model-value="groupColor"
        :disabled="!rules.canColor"
        @update:model-value="onGroupColorChange"
      />
      <div class="graph-properties__field">
        <span class="graph-properties__label">Выровнять</span>
        <div class="graph-properties__aligns">
          <button
            v-for="kind in ALIGN_KINDS"
            :key="kind"
            type="button"
            class="graph-properties__align"
            :disabled="!canAlign(kind)"
            @click="onAlign(kind)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <template v-if="kind === 'row'">
                <path d="M3 12 H21" />
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="12" cy="12" r="2.5" />
                <circle cx="18" cy="12" r="2.5" />
              </template>
              <template v-else-if="kind === 'column'">
                <path d="M12 3 V21" />
                <circle cx="12" cy="6" r="2.5" />
                <circle cx="12" cy="12" r="2.5" />
                <circle cx="12" cy="18" r="2.5" />
              </template>
              <template v-else-if="kind === 'spread-x'">
                <path d="M3 4 V20 M21 4 V20" />
                <circle cx="7" cy="12" r="2" />
                <circle cx="12" cy="9" r="2" />
                <circle cx="17" cy="14" r="2" />
              </template>
              <template v-else>
                <path d="M4 3 H20 M4 21 H20" />
                <circle cx="12" cy="7" r="2" />
                <circle cx="9" cy="12" r="2" />
                <circle cx="14" cy="17" r="2" />
              </template>
            </svg>
            {{ ALIGN_TITLES[kind] }}
          </button>
        </div>
      </div>
      <p class="graph-properties__empty graph-properties__small">
        Потяните любую из выбранных вершин, чтобы сдвинуть всю группу. Ctrl+клик добавляет или
        убирает вершину из выбора, Shift+2 — показать выбранное крупно.
      </p>
      <UiButton v-if="rules.canDelete" variant="danger" size="sm" @click="onDeleteClick">
        {{ deleteText }}
      </UiButton>
    </template>

    <template v-else>
      <h2 class="graph-properties__title">{{ title }}</h2>
      <p class="graph-properties__type">{{ typeText }}</p>

      <p class="graph-properties__prompt">
        <svg class="graph-properties__prompt-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3 L19 12 L12 13.5 L9 20 Z" />
        </svg>
        Нажмите на вершину или ребро, и здесь появятся его подпись, цвет и вес.
      </p>

      <section v-if="analysis" class="graph-properties__section">
        <h3 class="graph-properties__heading">Свойства графа</h3>
        <p v-if="facts.length === 0" class="graph-properties__empty">
          Поставьте хотя бы одну вершину.
        </p>
        <ul v-else class="graph-properties__facts">
          <li
            v-for="item in facts"
            :key="item.title"
            class="graph-properties__fact"
            :class="{ 'graph-properties__fact--yes': item.value }"
          >
            <span :key="String(item.value)" class="graph-properties__mark" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path v-if="item.value" d="M4 8.5 L7 11 L12 5" />
                <path v-else d="M5 8 H11" />
              </svg>
            </span>
            <span class="graph-properties__fact-title">{{ item.title }}</span>
            <span class="graph-properties__fact-value">
              {{ item.value ? "да" : "нет" }}
              <small v-if="item.note !== ''" class="graph-properties__note">{{ item.note }}</small>
            </span>
          </li>
        </ul>
        <p class="graph-properties__empty graph-properties__small">
          Обход, Дейкстру и остов можно показать по шагам: выберите вершину, с которой начать.
        </p>
        <button
          type="button"
          role="switch"
          class="graph-properties__switch"
          :aria-checked="showDegrees"
          @click="emit('update:showDegrees', !showDegrees)"
        >
          <span>Показывать степени</span>
          <span class="graph-properties__switch-track" aria-hidden="true">
            <span class="graph-properties__switch-thumb" />
          </span>
        </button>
        <button
          type="button"
          role="switch"
          class="graph-properties__switch"
          :aria-checked="showComponents"
          @click="emit('update:showComponents', !showComponents)"
        >
          <span>Раскрасить компоненты</span>
          <span class="graph-properties__switch-track" aria-hidden="true">
            <span class="graph-properties__switch-thumb" />
          </span>
        </button>
      </section>

      <section v-if="limits !== ''" class="graph-properties__section">
        <h3 class="graph-properties__heading">Ограничения задачи</h3>
        <p class="graph-properties__empty">{{ limits }}</p>
      </section>

      <button type="button" class="graph-properties__help" @click="emit('help')">
        <kbd class="graph-properties__key">?</kbd>
        Горячие клавиши
      </button>
    </template>
  </aside>
</template>

<style scoped>
.graph-properties {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.graph-properties__title {
  margin: 0;
  padding-right: 40px;
  font-size: var(--font-size-lg);
}

.graph-properties__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.graph-properties__type {
  align-self: flex-start;
  margin: calc(var(--space-2) * -1) 0 0;
  padding: 2px var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.graph-properties__prompt {
  display: flex;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.graph-properties__prompt-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  fill: var(--color-accent-muted);
  stroke: var(--color-accent);
  stroke-width: 1.8;
  stroke-linejoin: round;
}

.graph-properties__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.graph-properties__switch:focus-visible,
.graph-properties__help:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-properties__switch-track {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 11px;
  background: var(--color-border);
  transition: background-color var(--duration) var(--ease-out);
}

.graph-properties__switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition: transform var(--duration) var(--ease-spring);
}

.graph-properties__switch[aria-checked="true"] .graph-properties__switch-track {
  background: var(--color-accent);
}

.graph-properties__switch[aria-checked="true"] .graph-properties__switch-thumb {
  transform: translateX(16px);
}

.graph-properties__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.graph-properties__heading {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.graph-properties__key {
  padding: 1px var(--space-2);
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-page);
  color: var(--color-text-muted);
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
}

.graph-properties__small {
  font-size: var(--font-size-sm);
}

.graph-properties__hero {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-right: 40px;
}

.graph-properties__hero .graph-properties__title {
  padding-right: 0;
  overflow-wrap: anywhere;
}

.graph-properties__hero-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.graph-properties__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.graph-properties__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 2.5px solid var(--graph-vertex-stroke);
  border-radius: 50%;
  background: var(--graph-vertex-fill);
  color: var(--graph-vertex-text);
  font-size: var(--font-size-lg);
  font-weight: 800;
  transition:
    background-color var(--duration) var(--ease-out),
    border-color var(--duration) var(--ease-out);
  animation: graph-avatar-in 420ms var(--ease-spring);
}

.graph-properties__avatar--edge {
  border-radius: var(--radius-md);
  color: var(--graph-vertex-stroke);
}

.graph-properties__avatar svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.graph-properties__avatar--red {
  border-color: var(--graph-red-stroke);
  background: var(--graph-red-fill);
  color: var(--graph-red-stroke);
}

.graph-properties__avatar--green {
  border-color: var(--graph-green-stroke);
  background: var(--graph-green-fill);
  color: var(--graph-green-stroke);
}

.graph-properties__avatar--blue {
  border-color: var(--graph-blue-stroke);
  background: var(--graph-blue-fill);
  color: var(--graph-blue-stroke);
}

.graph-properties__avatar:not(.graph-properties__avatar--edge) {
  color: var(--graph-vertex-text);
}

@keyframes graph-avatar-in {
  from {
    transform: scale(0.6);
  }
}

.graph-properties__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-page);
}

.graph-properties__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.graph-properties__label {
  font-weight: 500;
}

.graph-properties__weight {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.graph-properties__weight-field {
  flex: 1;
  min-width: 0;
}

.graph-properties__stepper {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.graph-properties__step {
  width: 36px;
  height: var(--control-height-md);
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-lg);
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.graph-properties__step + .graph-properties__step {
  border-left: 1px solid var(--color-border);
}

.graph-properties__step:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.graph-properties__step:active:not(:disabled) {
  background: var(--color-accent-muted);
}

.graph-properties__step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.graph-properties__algorithms {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.graph-properties__algorithm {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.graph-properties__algorithm:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.graph-properties__algorithm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.graph-properties__algorithm:focus-visible,
.graph-properties__step:focus-visible,
.graph-properties__delete:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-properties__algorithm-text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.graph-properties__algorithm-title {
  font-size: var(--font-size-md);
  font-weight: 600;
}

.graph-properties__algorithm-note {
  color: var(--color-text-muted);
  font-size: 12px;
}

.graph-properties__algorithm-play {
  width: 16px;
  height: 16px;
  fill: var(--graph-active);
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.graph-properties__algorithm:hover:not(:disabled) .graph-properties__algorithm-play,
.graph-properties__algorithm:focus-visible .graph-properties__algorithm-play {
  opacity: 1;
  transform: none;
}

.graph-properties__aligns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.graph-properties__align {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-page);
  color: var(--color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.graph-properties__align:hover:not(:disabled) {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.graph-properties__align:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.graph-properties__align:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-properties__align svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  fill: var(--color-accent-muted);
  stroke: var(--color-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
}

.graph-properties__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: auto;
  padding: var(--space-2) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-danger);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.graph-properties__delete:hover {
  border-color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
}

.graph-properties__delete svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.graph-properties__help {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  align-self: flex-start;
  margin-top: auto;
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.graph-properties__help:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.graph-properties__facts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--font-size-sm);
}

.graph-properties__fact {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.graph-properties__mark {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-page);
  color: var(--color-text-muted);
  animation: graph-fact-pop var(--duration) var(--ease-spring);
}

.graph-properties__mark svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.graph-properties__fact--yes .graph-properties__mark {
  background: var(--color-success);
  color: var(--color-surface);
}

.graph-properties__fact-title {
  flex: 1;
}

.graph-properties__fact-value {
  color: var(--color-text-muted);
  text-align: right;
}

.graph-properties__fact--yes .graph-properties__fact-value {
  color: var(--color-text);
  font-weight: 600;
}

.graph-properties__note {
  display: block;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 400;
}

@keyframes graph-fact-pop {
  from {
    transform: scale(0.4);
  }
  to {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-properties__mark {
    animation: none;
  }
}
</style>
