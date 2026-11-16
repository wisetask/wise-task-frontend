<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label class="ui-checkbox" :class="{ 'ui-checkbox--disabled': disabled }">
    <input v-model="model" type="checkbox" class="ui-checkbox__input" :disabled="disabled" />
    <span>{{ label }}</span>
  </label>
</template>

<style scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-md);
  cursor: pointer;
}

.ui-checkbox__input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.ui-checkbox__input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.ui-checkbox--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ui-checkbox--disabled .ui-checkbox__input {
  cursor: not-allowed;
}
</style>
