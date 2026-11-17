<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { useGraphHistory } from "@/features/graph-history";
import { UiButton, UiCheckbox } from "@/shared/ui";
import {
  GraphCanvas,
  GraphPropertiesPanel,
  GraphStatsBar,
  GraphToolbar,
  isSelectionValid,
  type EditorTool,
  type GraphSelection,
} from "@/widgets/graph-editor";
import { browserStorage, loadGraph, saveGraph } from "../lib/savedGraph";

const storage = browserStorage();
const savedGraph = loadGraph(storage);
const graph = ref<Graph>(savedGraph === null ? createEmptyGraph(false) : savedGraph);
const tool = ref<EditorTool>("vertex");
const selection = ref<GraphSelection | null>(null);
const viewOnly = ref(false);
const history = useGraphHistory(graph);
const canUndo = history.canUndo;
const canRedo = history.canRedo;

const hints = {
  select: "Тяните по пустому месту — рамка. Shift+клик — добавить к выбору, Ctrl+A — всё.",
  pan: "Тяните мышью, чтобы двигать холст. Колесо — масштаб. Граф в этом режиме не меняется.",
  vertex: "Кликайте по пустому месту, чтобы добавить вершины. Их можно перетаскивать.",
  edge: "Кликните по первой вершине, потом по второй. Дважды по одной — петля. Esc — отмена.",
  delete: "Кликните по вершине или ребру, чтобы удалить.",
};

const hint = computed(() => {
  if (viewOnly.value) {
    return "Только просмотр: граф можно двигать и масштабировать, но не менять.";
  }
  return hints[tool.value];
});

watch(graph, (value) => {
  saveGraph(storage, value);
});

watch(viewOnly, () => {
  selection.value = null;
});

function forgetMissingSelection() {
  if (selection.value !== null && !isSelectionValid(graph.value, selection.value)) {
    selection.value = null;
  }
}

function onBeforeChange(snapshot: Graph) {
  history.record(snapshot);
}

function onUndo() {
  history.undo();
  forgetMissingSelection();
}

function onRedo() {
  history.redo();
  forgetMissingSelection();
}

function onDirectedChange(isDirected: boolean) {
  history.record(graph.value);
  graph.value = setDirected(graph.value, isDirected);
}

function clearGraph() {
  if (graph.value.vertices.length === 0) {
    return;
  }
  history.record(graph.value);
  graph.value = createEmptyGraph(graph.value.isDirected);
  selection.value = null;
}
</script>

<template>
  <main class="sandbox">
    <header class="sandbox__header">
      <h1 class="sandbox__title">Песочница редактора</h1>
      <span class="sandbox__hint">{{ hint }}</span>
      <UiCheckbox v-model="viewOnly" class="sandbox__toggle" label="Только просмотр" />
      <template v-if="!viewOnly">
        <UiCheckbox
          class="sandbox__nowrap"
          :model-value="graph.isDirected"
          label="Ориентированный"
          @update:model-value="onDirectedChange"
        />
        <UiButton size="sm" @click="clearGraph">Очистить</UiButton>
      </template>
    </header>
    <div class="sandbox__workspace" :class="{ 'sandbox__workspace--view': viewOnly }">
      <GraphToolbar
        v-if="!viewOnly"
        v-model:tool="tool"
        class="sandbox__toolbar"
        :can-undo="canUndo"
        :can-redo="canRedo"
        @undo="onUndo"
        @redo="onRedo"
      />
      <div class="sandbox__center">
        <div class="sandbox__canvas">
          <GraphCanvas
            v-model:graph="graph"
            v-model:selection="selection"
            :tool="tool"
            :readonly="viewOnly"
            @before-change="onBeforeChange"
          />
        </div>
        <GraphStatsBar :graph="graph" />
      </div>
      <GraphPropertiesPanel
        v-if="!viewOnly"
        v-model:graph="graph"
        v-model:selection="selection"
        class="sandbox__properties"
        @before-change="onBeforeChange"
      />
    </div>
  </main>
</template>

<style scoped>
.sandbox {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sandbox__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.sandbox__title {
  margin: 0;
  font-size: var(--font-size-lg);
  white-space: nowrap;
}

.sandbox__hint {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sandbox__toggle {
  margin-left: auto;
  white-space: nowrap;
}

.sandbox__nowrap {
  white-space: nowrap;
}

.sandbox__workspace {
  display: grid;
  flex: 1;
  grid-template-columns: auto 1fr 280px;
  min-height: 0;
}

.sandbox__workspace--view {
  grid-template-columns: 1fr;
}

.sandbox__toolbar {
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.sandbox__center {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.sandbox__canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sandbox__properties {
  overflow-y: auto;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
}
</style>
