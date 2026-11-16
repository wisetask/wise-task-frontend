<script setup lang="ts">
import type { GraphColor } from "@/entities/graph";
import { colorClass, GRAPH_COLORS } from "../lib/colors";

const color = defineModel<GraphColor>({ required: true });
</script>

<template>
  <div class="graph-color-picker">
    <span class="graph-color-picker__label">Цвет</span>
    <div class="graph-color-picker__options" role="group" aria-label="Цвет">
      <button
        v-for="option in GRAPH_COLORS"
        :key="option.value"
        type="button"
        class="graph-color-picker__option"
        :class="[
          'graph-color-picker__option--' + colorClass(option.value),
          { 'graph-color-picker__option--active': color === option.value },
        ]"
        :aria-pressed="color === option.value"
        :title="option.title"
        @click="color = option.value"
      >
        <span class="graph-color-picker__name">{{ option.title }}</span>
      </button>
    </div>
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

.graph-color-picker__options {
  display: flex;
  gap: var(--space-2);
}

.graph-color-picker__option {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 2px solid var(--graph-vertex-stroke);
  border-radius: 50%;
  background: var(--graph-vertex-fill);
  cursor: pointer;
}

.graph-color-picker__option--red {
  border-color: var(--graph-red-stroke);
  background: var(--graph-red-fill);
}

.graph-color-picker__option--green {
  border-color: var(--graph-green-stroke);
  background: var(--graph-green-fill);
}

.graph-color-picker__option--blue {
  border-color: var(--graph-blue-stroke);
  background: var(--graph-blue-fill);
}

.graph-color-picker__option--active {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.graph-color-picker__option:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-color-picker__name {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
