<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { UiButton, UiCheckbox } from "@/shared/ui";
import { GraphEditor, toolHint, type EditorTool } from "@/widgets/graph-editor";
import { browserStorage, loadGraph, saveGraph } from "../lib/savedGraph";

const storage = browserStorage();
const savedGraph = loadGraph(storage);
const graph = ref<Graph>(savedGraph === null ? createEmptyGraph(false) : savedGraph);
const tool = ref<EditorTool>("vertex");
const viewOnly = ref(false);
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);

const hint = computed(() => toolHint(tool.value, viewOnly.value));

watch(graph, (value) => {
  saveGraph(storage, value);
});

function onDirectedChange(isDirected: boolean) {
  if (editor.value !== null) {
    editor.value.replaceGraph(setDirected(graph.value, isDirected));
  }
}

function clearGraph() {
  if (editor.value !== null && graph.value.vertices.length > 0) {
    editor.value.replaceGraph(createEmptyGraph(graph.value.isDirected));
  }
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
    <GraphEditor
      ref="editor"
      v-model:graph="graph"
      v-model:tool="tool"
      class="sandbox__editor"
      :readonly="viewOnly"
    />
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

.sandbox__editor {
  flex: 1;
  min-height: 0;
}
</style>
