<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
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

interface Ping {
  id: number;
  x: number;
  y: number;
}

const pings = ref<Ping[]>([]);
let pingCount = 0;

function onPointerDown(event: PointerEvent) {
  if (props.disabled || props.loading) {
    return;
  }
  const button = event.currentTarget;
  if (!(button instanceof HTMLElement)) {
    return;
  }
  const rect = button.getBoundingClientRect();
  pingCount = pingCount + 1;
  pings.value.push({ id: pingCount, x: event.clientX - rect.left, y: event.clientY - rect.top });
}

function removePing(id: number) {
  pings.value = pings.value.filter((ping) => ping.id !== id);
}
</script>

<template>
  <button
    :type="type"
    class="ui-button"
    :class="['ui-button--' + variant, 'ui-button--' + size]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    @pointerdown="onPointerDown"
  >
    <span
      v-for="ping in pings"
      :key="ping.id"
      class="ui-button__ping"
      :style="{ left: ping.x + 'px', top: ping.y + 'px' }"
      aria-hidden="true"
      @animationend.self="removePing(ping.id)"
    />
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.ui-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ui-button:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
  transition-duration: 60ms;
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
  box-shadow: var(--shadow-accent);
}

.ui-button--secondary {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

.ui-button--secondary:hover:not(:disabled) {
  border-color: var(--color-accent);
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

.ui-button__ping {
  position: absolute;
  z-index: -1;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
  animation: ui-button-vertex 520ms var(--ease-out) forwards;
}

.ui-button__ping::after {
  content: "";
  position: absolute;
  inset: -2px;
  border: 2px solid currentColor;
  border-radius: 50%;
  animation: ui-button-ring 520ms var(--ease-out) forwards;
}

@keyframes ui-button-vertex {
  0% {
    opacity: 0.45;
    transform: scale(0);
  }
  35% {
    opacity: 0.4;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes ui-button-ring {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(8);
  }
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
  .ui-button:hover:not(:disabled),
  .ui-button:active:not(:disabled) {
    transform: none;
  }

  .ui-button__ping,
  .ui-button__ping::after {
    animation-duration: 1ms;
  }

  .ui-button__spinner {
    animation-duration: 2s;
  }
}
</style>
