<script setup lang="ts">
import { computed } from "vue";
import { graphStatistics, type Graph } from "@/entities/graph";
import { buildStatsItems } from "../lib/statsItems";

const props = defineProps<{
  graph: Graph;
}>();

const items = computed(() => buildStatsItems(graphStatistics(props.graph)));
</script>

<template>
  <dl class="graph-stats" aria-label="Статистика графа">
    <div v-for="item in items" :key="item.label" class="graph-stats__item">
      <dt class="graph-stats__label">{{ item.label }}</dt>
      <dd class="graph-stats__value">{{ item.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.graph-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-5);
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font-size: var(--font-size-sm);
}

.graph-stats__item {
  display: flex;
  gap: var(--space-1);
}

.graph-stats__label {
  color: var(--color-text-muted);
}

.graph-stats__value {
  margin: 0;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
</style>
