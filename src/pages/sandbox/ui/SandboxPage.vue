<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { graphql } from "@/shared/api/generated";
import {
  addEdge,
  addVertex,
  createEmptyGraph,
  findVertex,
  removeVertex,
  type Graph,
} from "@/entities/graph";


const PluginsCountQuery = graphql(`
  query SandboxPluginsCount {
    getAllPlugins(request: { pagination: { page: 0, pageSize: 1 } }) {
      pagination {
        totalCount
      }
    }
  }
`);
const { result, loading, error } = useQuery(PluginsCountQuery);

const graph = ref<Graph>(createEmptyGraph(false));
const selectedVertexId = ref<string | null>(null);

interface EdgeLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const edgeLines = computed(() => {
  const lines: EdgeLine[] = [];
  for (const edge of graph.value.edges) {
    const source = findVertex(graph.value, edge.source);
    const target = findVertex(graph.value, edge.target);
    if (source && target) {
      lines.push({ id: edge.id, x1: source.x, y1: source.y, x2: target.x, y2: target.y });
    }
  }
  return lines;
});

function onCanvasClick(event: MouseEvent) {
  graph.value = addVertex(graph.value, event.offsetX, event.offsetY);
  selectedVertexId.value = null;
}

function onVertexClick(vertexId: string) {
  if (selectedVertexId.value === null) {
    selectedVertexId.value = vertexId;
    return;
  }
  graph.value = addEdge(graph.value, selectedVertexId.value, vertexId);
  selectedVertexId.value = null;
}

function onVertexRightClick(vertexId: string) {
  graph.value = removeVertex(graph.value, vertexId);
  selectedVertexId.value = null;
}

function clearGraph() {
  graph.value = createEmptyGraph(false);
  selectedVertexId.value = null;
}
</script>

<template>
  <main class="sandbox">
    <header class="sandbox__header">
      <h1 class="sandbox__title">Песочница редактора</h1>
      <span class="sandbox__stats">
        Вершин: {{ graph.vertices.length }} · Рёбер: {{ graph.edges.length }}
      </span>
      <button class="sandbox__button" type="button" @click="clearGraph">Очистить</button>
    </header>
    <p> Количество плагинов: {{result?.getAllPlugins.pagination?.totalCount}}. Ошибки: {{error}}</p>
    <p class="sandbox__hint">
      Клик по пустому месту — вершина. Клик по двум вершинам — ребро.
      Правый клик по вершине — удалить.
    </p>
    <svg class="sandbox__canvas" @click.self="onCanvasClick">
      <line
        v-for="line in edgeLines"
        :key="line.id"
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        class="sandbox__edge"
      />
      <g
        v-for="vertex in graph.vertices"
        :key="vertex.id"
        class="sandbox__vertex"
        :class="{ 'sandbox__vertex--selected': vertex.id === selectedVertexId }"
        @click.stop="onVertexClick(vertex.id)"
        @contextmenu.prevent="onVertexRightClick(vertex.id)"
      >
        <circle :cx="vertex.x" :cy="vertex.y" r="18" />
        <text :x="vertex.x" :y="vertex.y + 5" text-anchor="middle">{{ vertex.label }}</text>
      </g>
    </svg>
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
  color: #59636e;
}

.sandbox__button {
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
  background: #f6f8fa;
  cursor: pointer;
}

.sandbox__hint {
  margin: 0;
  color: #59636e;
  font-size: 14px;
}

.sandbox__canvas {
  flex: 1;
  width: 100%;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  background: #fbfbfb;
}

.sandbox__edge {
  stroke: #59636e;
  stroke-width: 2;
}

.sandbox__vertex {
  cursor: pointer;
}

.sandbox__vertex circle {
  fill: #e6e6e6;
  stroke: #59636e;
  stroke-width: 2;
}

.sandbox__vertex--selected circle {
  stroke: #0969da;
  stroke-width: 3;
}

.sandbox__vertex text {
  font-size: 14px;
  pointer-events: none;
  user-select: none;
}
</style>
