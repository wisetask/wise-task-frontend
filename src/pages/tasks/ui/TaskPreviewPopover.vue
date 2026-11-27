<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import type { Graph } from "@/entities/graph";
import { GraphMiniature, loadThumbGraph } from "@/widgets/task-view";
import type { TaskListItem } from "../model/taskList";

const props = defineProps<{
  task: TaskListItem;
  left: number;
  top: number;
  colorClass: string;
}>();

const graph = shallowRef<Graph | null>(null);
const loading = shallowRef(true);

onMounted(async () => {
  graph.value = await loadThumbGraph(props.task.id);
  loading.value = false;
});
</script>

<template>
  <div
    class="preview"
    :class="colorClass"
    :style="{ left: left + 'px', top: top + 'px' }"
    aria-hidden="true"
  >
    <span v-if="task.category !== ''" class="preview__category">{{ task.category }}</span>
    <p class="preview__name">{{ task.name }}</p>
    <div v-if="loading || graph !== null" class="preview__graph">
      <GraphMiniature :graph="graph" :loading="loading" large />
    </div>
    <p v-if="task.fullDescription !== ''" class="preview__text">{{ task.fullDescription }}</p>
    <p v-if="task.author !== ''" class="preview__author">{{ task.author }}</p>
  </div>
</template>

<style scoped>
.preview {
  position: fixed;
  z-index: 8;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 340px;
  max-height: 420px;
  overflow: hidden;
  padding: var(--space-3) var(--space-4) var(--space-4);
  border: 1px solid color-mix(in srgb, var(--cat, var(--color-accent)) 60%, var(--color-border));
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  pointer-events: none;
  animation: preview-in 260ms var(--ease-spring) backwards;
}

.preview__category {
  align-self: flex-start;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--cat, var(--color-accent)) 18%, transparent);
  color: var(--cat, var(--color-accent));
  font-size: 12px;
  font-weight: 600;
}

.preview__name {
  margin: 0;
  font-weight: 700;
  line-height: 1.35;
}

.preview__graph {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--graph-canvas-bg);
}

.preview__text {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 7;
}

.preview__author {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
}

@keyframes preview-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
}
</style>
