<script setup lang="ts">
import { computed, watch } from "vue";
import {
  findEdge,
  findVertex,
  removeEdge,
  removeVertex,
  updateEdge,
  updateVertex,
  type Graph,
  type GraphColor,
  type VertexChanges,
} from "@/entities/graph";
import { UiButton, UiTextField } from "@/shared/ui";
import { createEditSession } from "../lib/editSession";
import { describeEdge } from "../lib/labels";
import type { GraphSelection } from "../lib/selection";
import { parseWeight } from "../lib/weight";
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
  return "Свойства";
});

const deleteText = computed(() => (vertex.value ? "Удалить вершину" : "Удалить ребро"));

const labelPlaceholder = computed(() => (edge.value ? "Например, a" : ""));

watch(
  () => props.selection,
  () => {
    editSession.finish();
  },
);

function fieldKey(field: string): string {
  if (props.selection === null) {
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

function onDeleteClick() {
  emit("before-change", props.graph);
  if (vertex.value) {
    emit("update:graph", removeVertex(props.graph, vertex.value.id));
  } else if (edge.value) {
    emit("update:graph", removeEdge(props.graph, edge.value.id));
  }
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
        inputmode="decimal"
        hint="Целое или дробное число, можно отрицательное"
        @update:model-value="onWeightInput"
      />
      <UiButton variant="danger" size="sm" @click="onDeleteClick">{{ deleteText }}</UiButton>
    </template>

    <template v-else>
      <p class="graph-properties__empty">
        Выберите вершину или ребро, чтобы изменить подпись, цвет и вес.
      </p>
      <dl class="graph-properties__summary">
        <dt>Вершин</dt>
        <dd>{{ graph.vertices.length }}</dd>
        <dt>Рёбер</dt>
        <dd>{{ graph.edges.length }}</dd>
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
