<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    type?: "text" | "email" | "password";
    inputmode?: "text" | "decimal" | "numeric" | "email";
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    autocomplete?: string;
  }>(),
  {
    type: "text",
    placeholder: "",
    hint: "",
    error: "",
    disabled: false,
    required: false,
    autocomplete: "off",
    inputmode: "text",
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
  <div class="ui-text-field" :class="{ 'ui-text-field--invalid': hasError }">
    <label :for="inputId" class="ui-text-field__label">
      {{ label }}
      <span v-if="required" class="ui-text-field__required" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      class="ui-text-field__input"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-invalid="hasError"
      :aria-describedby="message !== '' ? messageId : undefined"
    />
    <p v-if="message !== ''" :id="messageId" class="ui-text-field__message">{{ message }}</p>
  </div>
</template>

<style scoped>
.ui-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ui-text-field__label {
  font-size: var(--font-size-md);
  font-weight: 500;
}

.ui-text-field__required {
  margin-left: 2px;
  color: var(--color-danger);
}

.ui-text-field__input {
  height: var(--control-height-md);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.ui-text-field__input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -1px;
}

.ui-text-field__input:disabled {
  background: var(--color-surface-muted);
  cursor: not-allowed;
}

.ui-text-field__message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ui-text-field--invalid .ui-text-field__input {
  border-color: var(--color-danger);
}

.ui-text-field--invalid .ui-text-field__input:focus-visible {
  outline-color: var(--color-danger);
}

.ui-text-field--invalid .ui-text-field__message {
  color: var(--color-danger);
}
</style>
