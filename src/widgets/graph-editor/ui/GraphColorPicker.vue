<script setup lang="ts">
import type { GraphColor } from "@/entities/graph";
import GraphColorSwatches from "./GraphColorSwatches.vue";

const color = defineModel<GraphColor>({ required: true });
</script>

<template>
  <div class="graph-color-picker">
    <span class="graph-color-picker__label">Цвет</span>
    <GraphColorSwatches v-model="color" />
  </div>
</template>

<style scoped>
.graph-color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.graph-color-picker__label {
  font-weight: 500;
}
</style>
