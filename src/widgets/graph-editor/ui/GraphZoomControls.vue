<script setup lang="ts">
import { ref, watch } from "vue";
import { UiButton } from "@/shared/ui";
import { parseZoomPercent } from "../lib/viewport";

const props = defineProps<{
  percent: number;
}>();

const emit = defineEmits<{
  zoomIn: [];
  zoomOut: [];
  setPercent: [percent: number];
}>();

const inputElement = ref<HTMLInputElement | null>(null);
const draft = ref(formatPercent(props.percent));

let cancelled = false;

function formatPercent(value: number): string {
  return value + "%";
}

watch(
  () => props.percent,
  (value) => {
    draft.value = formatPercent(value);
  },
);

function onFocus() {
  if (inputElement.value !== null) {
    inputElement.value.select();
  }
}

function onBlur() {
  if (!cancelled) {
    const value = parseZoomPercent(draft.value);
    if (value !== null) {
      emit("setPercent", value);
    }
  }
  cancelled = false;
  draft.value = formatPercent(props.percent);
}

function onKeyDown(event: KeyboardEvent) {
  if (inputElement.value === null) {
    return;
  }
  if (event.key === "Enter") {
    inputElement.value.blur();
  } else if (event.key === "Escape") {
    event.stopPropagation();
    cancelled = true;
    inputElement.value.blur();
  }
}
</script>

<template>
  <div class="graph-zoom" role="group" aria-label="Масштаб">
    <UiButton size="sm" title="Уменьшить" @click="emit('zoomOut')">−</UiButton>
    <input
      ref="inputElement"
      v-model="draft"
      class="graph-zoom__input"
      type="text"
      inputmode="decimal"
      aria-label="Масштаб в процентах"
      title="Впишите масштаб от 25 до 400% и нажмите Enter"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown"
    />
    <UiButton size="sm" title="Увеличить" @click="emit('zoomIn')">+</UiButton>
  </div>
</template>

<style scoped>
.graph-zoom {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.graph-zoom__input {
  width: 64px;
  height: var(--control-height-sm);
  padding: 0 var(--space-1);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.graph-zoom__input:hover {
  border-color: var(--color-border);
}

.graph-zoom__input:focus-visible {
  border-color: var(--color-focus);
  outline: none;
  background: var(--color-surface);
}
</style>
