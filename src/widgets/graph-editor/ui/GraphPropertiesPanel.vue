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
import { describeEdge, describeGroup } from "../lib/labels";
import {
  commonColor,
  paintSelected,
  removeSelected,
  selectedIds,
  type GraphSelection,
} from "../lib/selection";
import { parseWeight, weightError } from "../lib/weight";
import GraphColorPicker from "./GraphColorPicker.vue";

const props = defineProps<{
  graph: Graph;
  selection: GraphSelection | null;
}>();

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
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
  return "Свойства";
});

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
        @update:model-value="onLabelInput"
      />
      <GraphColorPicker :model-value="selected.color" @update:model-value="onColorChange" />
      <UiTextField
        :key="'weight-' + selected.id"
        :model-value="String(selected.weight)"
        label="Вес"
        hint="Целое число, можно отрицательное"
        :error="weightProblem"
        @update:model-value="onWeightInput"
      />
      <UiButton variant="danger" size="sm" @click="onDeleteClick">{{ deleteText }}</UiButton>
    </template>

    <template v-else-if="group">
      <GraphColorPicker :model-value="groupColor" @update:model-value="onGroupColorChange" />
      <p class="graph-properties__empty">
        Потяните любую из выбранных вершин, чтобы сдвинуть всю группу. Ctrl+клик добавляет или
        убирает вершину из выбора.
      </p>
      <UiButton variant="danger" size="sm" @click="onDeleteClick">{{ deleteText }}</UiButton>
    </template>

    <template v-else>
      <p class="graph-properties__empty">
        Выберите вершину или ребро, чтобы изменить подпись, цвет и вес. Несколько вершин можно
        выделить рамкой.
      </p>
      <dl class="graph-properties__summary">
        <dt>Тип</dt>
        <dd>{{ graph.isDirected ? "ориентированный" : "неориентированный" }}</dd>
      </dl>
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
  font-size: var(--font-size-lg);
}

.graph-properties__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.graph-properties__summary {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-4);
  margin: 0;
}

.graph-properties__summary dt {
  color: var(--color-text-muted);
}

.graph-properties__summary dd {
  margin: 0;
}
</style>
