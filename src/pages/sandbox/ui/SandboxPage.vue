<script setup lang="ts">
import { ref } from "vue";
import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { UiButton, UiCheckbox } from "@/shared/ui";
import { GraphCanvas } from "@/widgets/graph-canvas";

const graph = ref<Graph>(createEmptyGraph(false));

function onDirectedChange(isDirected: boolean) {
  graph.value = setDirected(graph.value, isDirected);
}

function clearGraph() {
  graph.value = createEmptyGraph(graph.value.isDirected);
}
</script>

<template>
  <main class="sandbox">
    <header class="sandbox__header">
      <h1 class="sandbox__title">Песочница редактора</h1>
      <span class="sandbox__stats">
        Вершин: {{ graph.vertices.length }} · Рёбер: {{ graph.edges.length }}
      </span>
      <UiCheckbox
        class="sandbox__toggle"
        :model-value="graph.isDirected"
        label="Ориентированный"
        @update:model-value="onDirectedChange"
      />
      <UiButton size="sm" @click="clearGraph">Очистить</UiButton>
    </header>
    <p class="sandbox__hint">
      Клик по пустому месту — вершина. Клик по вершине, потом по другой — ребро, дважды по одной —
      петля. Вершины можно перетаскивать. Правый клик по вершине или ребру — удалить. Esc — снять
      выделение.
    </p>
    <div class="sandbox__canvas">
      <GraphCanvas v-model:graph="graph" />
    </div>
  </main>
</template>

<style scoped>
.sandbox {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 8px;
}

.sandbox__header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sandbox__title {
  margin: 0;
  font-size: 20px;
}

.sandbox__stats {
  color: var(--color-text-muted);
}

.sandbox__toggle {
  margin-left: auto;
}

.sandbox__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.sandbox__canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
</style>
