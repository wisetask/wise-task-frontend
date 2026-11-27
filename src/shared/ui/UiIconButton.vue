<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    pressed?: boolean | null;
    disabled?: boolean;
  }>(),
  {
    pressed: null,
    disabled: false,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    class="ui-icon-button"
    :class="{ 'ui-icon-button--pressed': pressed === true }"
    :aria-label="label"
    :aria-pressed="pressed === null ? undefined : pressed"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <span class="ui-icon-button__icon" aria-hidden="true">
      <slot />
    </span>
    <span class="ui-icon-button__tip" aria-hidden="true">{{ label }}</span>
  </button>
</template>

<style scoped>
.ui-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--control-height-sm);
  height: var(--control-height-sm);
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.ui-icon-button:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.ui-icon-button:active:not(:disabled) {
  transform: scale(0.92);
}

.ui-icon-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-icon-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.ui-icon-button--pressed {
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.ui-icon-button--pressed:hover:not(:disabled) {
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.ui-icon-button__icon {
  display: flex;
}

.ui-icon-button__icon :slotted(svg) {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ui-icon-button__tip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  z-index: 30;
  padding: 4px var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: var(--color-surface);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -4px);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.ui-icon-button:hover .ui-icon-button__tip,
.ui-icon-button:focus-visible .ui-icon-button__tip {
  opacity: 1;
  transform: translate(-50%, 0);
  transition-delay: 250ms;
}
</style>
