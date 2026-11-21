<script setup lang="ts">
import type { GraphColor } from "@/entities/graph";
import GraphColorSwatches from "./GraphColorSwatches.vue";

withDefaults(
  defineProps<{
    modelValue: GraphColor | null;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [color: GraphColor];
}>();
</script>

<template>
  <div class="graph-color-picker">
    <span class="graph-color-picker__label">Цвет</span>
    <GraphColorSwatches
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
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
