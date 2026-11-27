<script setup lang="ts">
import type { GraphColor } from "@/entities/graph";
import { colorClass, GRAPH_COLORS } from "../lib/colors";

withDefaults(
  defineProps<{
    modelValue: GraphColor | null;
    small?: boolean;
    disabled?: boolean;
  }>(),
  {
    small: false,
    disabled: false,
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
      :disabled="disabled"
      @click="emit('update:modelValue', option.value)"
    >
      <svg
        v-if="modelValue === option.value"
        class="graph-swatches__check"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M4 8.5 L7 11 L12 5" />
      </svg>
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 2px solid var(--graph-vertex-stroke);
  border-radius: 50%;
  background: var(--graph-vertex-fill);
  color: var(--graph-vertex-stroke);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
}

.graph-swatches__option:hover:not(:disabled) {
  transform: scale(1.1);
}

.graph-swatches__option:active:not(:disabled) {
  transform: scale(0.92);
}

.graph-swatches--small .graph-swatches__check {
  width: 12px;
  height: 12px;
}

.graph-swatches__check {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 14;
  animation: graph-swatches-check 320ms var(--ease-out) both;
}

@keyframes graph-swatches-check {
  from {
    stroke-dashoffset: 14;
    transform: scale(0.6);
  }
  to {
    stroke-dashoffset: 0;
    transform: none;
  }
}

.graph-swatches--small .graph-swatches__option {
  width: 24px;
  height: 24px;
}

.graph-swatches__option--red {
  border-color: var(--graph-red-stroke);
  background: var(--graph-red-fill);
  color: var(--graph-red-stroke);
}

.graph-swatches__option--green {
  border-color: var(--graph-green-stroke);
  background: var(--graph-green-fill);
  color: var(--graph-green-stroke);
}

.graph-swatches__option--blue {
  border-color: var(--graph-blue-stroke);
  background: var(--graph-blue-fill);
  color: var(--graph-blue-stroke);
}

.graph-swatches__option:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.graph-swatches__option--active {
  box-shadow:
    0 0 0 3px var(--color-surface),
    0 0 0 5px currentColor;
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
