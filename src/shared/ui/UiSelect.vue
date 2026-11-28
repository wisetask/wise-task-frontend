<script setup lang="ts">
import { useId } from "vue";
import type { UiSelectOption } from "./select";

withDefaults(
  defineProps<{
    label: string;
    options: UiSelectOption[];
    hint?: string;
    disabled?: boolean;
  }>(),
  {
    hint: "",
    disabled: false,
  },
);

const model = defineModel<string>({ required: true });

const selectId = useId();
const hintId = selectId + "-hint";
</script>

<template>
  <div class="ui-select">
    <label :for="selectId" class="ui-select__label">{{ label }}</label>
    <select
      :id="selectId"
      v-model="model"
      class="ui-select__control"
      :disabled="disabled"
      :aria-describedby="hint !== '' ? hintId : undefined"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="hint !== ''" :id="hintId" class="ui-select__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.ui-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ui-select__label {
  font-size: var(--font-size-md);
  font-weight: 500;
}

.ui-select__control {
  width: 100%;
  min-width: 0;
  height: var(--control-height-md);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
}

.ui-select__control:hover:not(:disabled) {
  border-color: var(--color-text-muted);
}

.ui-select__control:focus-visible {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 4px var(--color-accent-muted);
}

.ui-select__control:disabled {
  background: var(--color-surface-muted);
  cursor: not-allowed;
}

.ui-select__hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
