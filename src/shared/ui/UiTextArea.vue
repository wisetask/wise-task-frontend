<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    rows?: number;
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    rows: 4,
    placeholder: "",
    hint: "",
    error: "",
    disabled: false,
    required: false,
  },
);

const model = defineModel<string>({ default: "" });

const inputId = useId();
const messageId = inputId + "-message";

const hasError = computed(() => props.error !== "");

const message = computed(() => {
  if (props.error !== "") {
    return props.error;
  }
  return props.hint;
});
</script>

<template>
  <div class="ui-text-area" :class="{ 'ui-text-area--invalid': hasError }">
    <label :for="inputId" class="ui-text-area__label">
      {{ label }}
      <span v-if="required" class="ui-text-area__required" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="inputId"
      v-model="model"
      class="ui-text-area__input"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="hasError"
      :aria-describedby="message !== '' ? messageId : undefined"
    />
    <p v-if="message !== ''" :id="messageId" class="ui-text-area__message">{{ message }}</p>
  </div>
</template>

<style scoped>
.ui-text-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ui-text-area__label {
  font-size: var(--font-size-md);
  font-weight: 500;
}

.ui-text-area__required {
  margin-left: 2px;
  color: var(--color-danger);
}

.ui-text-area__input {
  min-height: var(--control-height-md);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  line-height: 1.5;
  resize: vertical;
}

.ui-text-area__input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -1px;
}

.ui-text-area__input:disabled {
  background: var(--color-surface-muted);
  cursor: not-allowed;
}

.ui-text-area__message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ui-text-area--invalid .ui-text-area__input {
  border-color: var(--color-danger);
}

.ui-text-area--invalid .ui-text-area__message {
  color: var(--color-danger);
}
</style>
