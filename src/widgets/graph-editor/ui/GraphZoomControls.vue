<script setup lang="ts">
import { UiButton } from "@/shared/ui";

defineProps<{
  percent: number;
}>();

const emit = defineEmits<{
  zoomIn: [];
  zoomOut: [];
  reset: [];
}>();
</script>

<template>
  <div class="graph-zoom" role="group" aria-label="Масштаб">
    <UiButton size="sm" title="Уменьшить" @click="emit('zoomOut')">−</UiButton>
    <UiButton size="sm" variant="ghost" title="Вернуть 100%" @click="emit('reset')">
      {{ percent }}%
    </UiButton>
    <UiButton size="sm" title="Увеличить" @click="emit('zoomIn')">+</UiButton>
  </div>
</template>

<style scoped>
.graph-zoom {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
</style>
