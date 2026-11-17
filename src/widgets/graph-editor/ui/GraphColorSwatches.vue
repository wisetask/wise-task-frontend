<script setup lang="ts">
import type { GraphColor } from "@/entities/graph";
import { colorClass, GRAPH_COLORS } from "../lib/colors";

withDefaults(
  defineProps<{
    modelValue: GraphColor | null;
    small?: boolean;
  }>(),
  {
    small: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [color: GraphColor];
}>();
</script>

<template>
  <div
    class="graph-swatches"
    :class="{ 'graph-swatches--small': small }"
    role="group"
    aria-label="Цвет"
  >
    <button
      v-for="option in GRAPH_COLORS"
      :key="option.value"
      type="button"
      class="graph-swatches__option"
      :class="[
        'graph-swatches__option--' + colorClass(option.value),
        { 'graph-swatches__option--active': modelValue === option.value },
      ]"
      :aria-pressed="modelValue === option.value"
      :title="option.title"
      @click="emit('update:modelValue', option.value)"
    >
      <span class="graph-swatches__name">{{ option.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.graph-swatches {
  display: flex;
  gap: var(--space-2);
}

.graph-swatches__option {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 2px solid var(--graph-vertex-stroke);
  border-radius: 50%;
  background: var(--graph-vertex-fill);
  cursor: pointer;
}

.graph-swatches--small .graph-swatches__option {
  width: 24px;
  height: 24px;
}

.graph-swatches__option--red {
  border-color: var(--graph-red-stroke);
  background: var(--graph-red-fill);
}

.graph-swatches__option--green {
  border-color: var(--graph-green-stroke);
  background: var(--graph-green-fill);
}

.graph-swatches__option--blue {
  border-color: var(--graph-blue-stroke);
  background: var(--graph-blue-fill);
}

.graph-swatches__option--active {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.graph-swatches__option:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-swatches__name {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
