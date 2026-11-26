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
import { createEditSession } from "../lib/editSession";
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

const props = withDefaults(
  defineProps<{
    graph: Graph;
    selection: GraphSelection | null;
    rules?: EditorRules;
    analysis?: boolean;
    showDegrees?: boolean;
  }>(),
  {
    rules: () => allowEverything(),
    analysis: false,
    showDegrees: false,
  },
);

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
  "update:showDegrees": [value: boolean];
  help: [];
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
    <h2 class="graph-properties__title">{{ title }}</h2>

    <template v-if="selected">
      <UiTextField
        :key="'label-' + selected.id"
        :model-value="selected.label"
        label="Подпись"
        :placeholder="labelPlaceholder"
        :disabled="!rules.canEditLabels"
        @update:model-value="onLabelInput"
      />
      <GraphColorPicker
        :model-value="selected.color"
        :disabled="!rules.canColor"
        @update:model-value="onColorChange"
      />
      <UiTextField
        :key="'weight-' + selected.id"
        :model-value="String(selected.weight)"
        label="Вес"
        hint="Целое число, можно отрицательное"
        :error="weightProblem"
        :disabled="!rules.canEditLabels"
        @update:model-value="onWeightInput"
      />
      <UiButton v-if="rules.canDelete" variant="danger" size="sm" @click="onDeleteClick">
        {{ deleteText }}
      </UiButton>
    </template>

    <template v-else-if="group">
      <GraphColorPicker
        :model-value="groupColor"
        :disabled="!rules.canColor"
        @update:model-value="onGroupColorChange"
      />
      <p class="graph-properties__empty">
        Потяните любую из выбранных вершин, чтобы сдвинуть всю группу. Ctrl+клик добавляет или
        убирает вершину из выбора.
      </p>
      <UiButton v-if="rules.canDelete" variant="danger" size="sm" @click="onDeleteClick">
        {{ deleteText }}
      </UiButton>
    </template>

    <template v-else>
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
