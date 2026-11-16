<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
    type?: "button" | "submit";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: "secondary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
  },
);
</script>

<template>
  <button
    :type="type"
    class="ui-button"
    :class="['ui-button--' + variant, 'ui-button--' + size]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.ui-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.ui-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ui-button--md {
  height: var(--control-height-md);
  padding: 0 var(--space-4);
  font-size: var(--font-size-md);
}

.ui-button--sm {
  height: var(--control-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
}

.ui-button--primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.ui-button--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.ui-button--secondary {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.ui-button--secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.ui-button--ghost {
  background: transparent;
  color: var(--color-text);
}

.ui-button--ghost:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.ui-button--danger {
  background: var(--color-danger);
  color: var(--color-on-accent);
}

.ui-button--danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
}

.ui-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ui-button-spin 0.7s linear infinite;
}

@keyframes ui-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-button__spinner {
    animation-duration: 2s;
  }
}
</style>
