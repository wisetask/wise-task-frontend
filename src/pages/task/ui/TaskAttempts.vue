<script setup lang="ts">
import { onMounted, shallowRef, watch } from "vue";
import type { Graph } from "@/entities/graph";
import { GraphMiniature } from "@/widgets/task-view";
import { attemptTitle, type Attempt } from "../model/nextTask";
import { loadAttemptGraph } from "../model/useTaskExtras";

const props = defineProps<{
  attempts: Attempt[];
  total: number;
}>();

const emit = defineEmits<{
  pick: [graph: Graph];
}>();

const graphs = shallowRef<Record<string, Graph | null>>({});

async function loadGraphs() {
  for (const attempt of props.attempts) {
    if (graphs.value[attempt.id] !== undefined) {
      continue;
    }
    const graph = await loadAttemptGraph(attempt.id);
    const next: Record<string, Graph | null> = {};
    for (const key of Object.keys(graphs.value)) {
      next[key] = graphs.value[key];
    }
    next[attempt.id] = graph;
    graphs.value = next;
  }
}

function graphOf(id: string): Graph | null {
  const graph = graphs.value[id];
  return graph === undefined ? null : graph;
}

function isLoading(id: string): boolean {
  return graphs.value[id] === undefined;
}

function pick(id: string) {
  const graph = graphOf(id);
  if (graph !== null) {
    emit("pick", graph);
  }
}

function rowDelay(index: number): string {
  return index * 50 + "ms";
}

onMounted(loadGraphs);
watch(() => props.attempts, loadGraphs);
</script>

<template>
  <section class="attempts" aria-labelledby="task-attempts-title">
    <h2 id="task-attempts-title" class="attempts__title">
      Мои попытки
      <span class="attempts__count">{{ total }}</span>
    </h2>
    <p v-if="attempts.length === 0" class="attempts__empty">
      Попыток пока нет. Каждая проверка появится здесь.
    </p>
    <ul v-else class="attempts__list">
      <li
        v-for="(attempt, index) in attempts"
        :key="attempt.id"
        class="attempts__item"
        :style="{ animationDelay: rowDelay(index) }"
      >
        <button
          type="button"
          class="attempts__row"
          :class="attempt.isCorrect ? 'attempts__row--ok' : 'attempts__row--fail'"
          :disabled="graphOf(attempt.id) === null"
          :title="graphOf(attempt.id) === null ? '' : 'Загрузить этот граф в ответ'"
          @click="pick(attempt.id)"
        >
          <span class="attempts__status" aria-hidden="true">
            <svg v-if="attempt.isCorrect" viewBox="0 0 16 16">
              <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
            </svg>
            <svg v-else viewBox="0 0 16 16">
              <path d="M4.5 4.5 L11.5 11.5 M11.5 4.5 L4.5 11.5" />
            </svg>
          </span>
          <span class="attempts__words">
            <span class="attempts__name">{{ attemptTitle(index, total) }}</span>
            <span class="attempts__result">{{ attempt.isCorrect ? "верно" : "неверно" }}</span>
          </span>
          <span class="attempts__graph">
            <GraphMiniature :graph="graphOf(attempt.id)" :loading="isLoading(attempt.id)" />
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.attempts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.attempts__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.attempts__count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-surface-hover);
  color: var(--color-text);
  font-size: 12px;
}

.attempts__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.attempts__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.attempts__item {
  animation: attempts-in 360ms var(--ease-out) backwards;
}

.attempts__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 6px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-page);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.attempts__row:hover:not(:disabled) {
  border-color: var(--color-accent);
  transform: translateX(3px);
}

.attempts__row:disabled {
  cursor: default;
}

.attempts__row:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.attempts__status {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: var(--color-on-accent);
}

.attempts__row--ok .attempts__status {
  background: var(--color-success);
}

.attempts__row--fail .attempts__status {
  background: var(--color-danger);
}

.attempts__status svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.attempts__words {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.attempts__name {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.attempts__result {
  color: var(--color-text-muted);
  font-size: 12px;
}

.attempts__graph {
  flex-shrink: 0;
  width: 72px;
  height: 48px;
}

.attempts__graph :deep(.graph-mini) {
  width: 72px;
  height: 48px;
}

@keyframes attempts-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
