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
  fit: [];
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
    <UiButton size="sm" title="Показать весь граф (Shift+1)" @click="emit('fit')">
      <svg class="graph-zoom__icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 6 V2 H6 M10 2 H14 V6 M14 10 V14 H10 M6 14 H2 V10" />
      </svg>
      <span class="graph-zoom__label">Показать весь граф</span>
    </UiButton>
    <span class="graph-zoom__divider" />
    <UiButton size="sm" title="Уменьшить (−)" @click="emit('zoomOut')">−</UiButton>
    <input
      ref="inputElement"
      v-model="draft"
      class="graph-zoom__input"
      type="text"
      inputmode="decimal"
      aria-label="Масштаб в процентах"
      title="Впишите масштаб от 25 до 400% и нажмите Enter. Клавиша 0 — 100%"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown"
    />
    <UiButton size="sm" title="Увеличить (+)" @click="emit('zoomIn')">+</UiButton>
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

.graph-zoom__icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.graph-zoom__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.graph-zoom__divider {
  align-self: stretch;
  width: 1px;
  margin: var(--space-1) 0;
  background: var(--color-border);
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
