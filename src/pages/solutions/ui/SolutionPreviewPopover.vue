<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import type { Graph } from "@/entities/graph";
import { GraphMiniature, loadSolutionGraph } from "@/widgets/task-view";
import { attemptsText, groupSummary, type TaskGroup } from "../model/solutionList";

const props = defineProps<{
  group: TaskGroup;
  left: number;
  top: number;
  colorClass: string;
}>();

const graph = shallowRef<Graph | null>(null);
const loading = shallowRef(true);

onMounted(async () => {
  graph.value = await loadSolutionGraph(props.group.lastId);
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
    <span v-if="group.category !== ''" class="preview__category">{{ group.category }}</span>
    <p class="preview__name">{{ group.taskName }}</p>
    <p class="preview__label">Последний ответ</p>
    <div
      class="preview__graph"
      :class="group.lastCorrect ? 'preview__graph--ok' : 'preview__graph--fail'"
    >
      <GraphMiniature v-if="loading || graph !== null" :graph="graph" :loading="loading" large />
      <p v-else class="preview__none">Граф не сохранился</p>
    </div>
    <p class="preview__summary">
      {{ groupSummary(group) }} · {{ attemptsText(group.attempts.length) }}
    </p>
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

.preview__label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
}

.preview__graph {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--graph-canvas-bg);
}

.preview__graph--ok {
  border-color: color-mix(in srgb, var(--color-success) 55%, var(--color-border));
}

.preview__graph--fail {
  border-color: color-mix(in srgb, var(--color-danger) 55%, var(--color-border));
}

.preview__none {
  margin: 0;
  padding: var(--space-5) var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.preview__summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

@keyframes preview-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
}
</style>
