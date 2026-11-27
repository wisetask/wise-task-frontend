<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  applyTheme,
  currentTheme,
  nextTheme,
  storeTheme,
  toggleTitle,
  type Theme,
} from "../model/theme";

const theme = ref<Theme>("day");

const title = computed(() => toggleTitle(theme.value));

onMounted(() => {
  theme.value = currentTheme();
});

function onToggle() {
  const next = nextTheme(theme.value);
  theme.value = next;
  applyTheme(next);
  storeTheme(next);
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :class="'theme-toggle--' + theme"
    :title="title"
    :aria-label="title"
    @click="onToggle"
  >
    <svg class="theme-toggle__icon theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
      <g class="theme-toggle__spokes">
        <line x1="12.0" y1="6.5" x2="12.0" y2="3.0" />
        <line x1="16.8" y1="9.2" x2="19.8" y2="7.5" />
        <line x1="16.8" y1="14.8" x2="19.8" y2="16.5" />
        <line x1="12.0" y1="17.5" x2="12.0" y2="21.0" />
        <line x1="7.2" y1="14.8" x2="4.2" y2="16.5" />
        <line x1="7.2" y1="9.2" x2="4.2" y2="7.5" />
      </g>
      <g class="theme-toggle__dots">
        <circle cx="12.0" cy="3.0" r="1.6" />
        <circle cx="19.8" cy="7.5" r="1.6" />
        <circle cx="19.8" cy="16.5" r="1.6" />
        <circle cx="12.0" cy="21.0" r="1.6" />
        <circle cx="4.2" cy="16.5" r="1.6" />
        <circle cx="4.2" cy="7.5" r="1.6" />
      </g>
      <circle cx="12" cy="12" r="4" class="theme-toggle__core" />
    </svg>
    <svg class="theme-toggle__icon theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 4.5a7.5 7.5 0 1 0 4 13 6 6 0 0 1-4-13z" class="theme-toggle__crescent" />
      <line x1="17" y1="4" x2="21" y2="8" class="theme-toggle__edge" />
      <circle cx="17" cy="4" r="1.4" class="theme-toggle__star" />
      <circle cx="21" cy="8" r="1.4" class="theme-toggle__star" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--control-height-md);
  height: var(--control-height-md);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration) var(--ease-out),
    border-color var(--duration) var(--ease-out);
}

.theme-toggle:hover {
  background: var(--color-surface-hover);
  transform: translateY(-1px);
}

.theme-toggle:active {
  transform: scale(0.94);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.theme-toggle__icon {
  position: absolute;
  width: 22px;
  height: 22px;
  transition:
    opacity var(--duration) var(--ease-out),
    transform 420ms var(--ease-spring);
}

.theme-toggle__spokes {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}

.theme-toggle__dots,
.theme-toggle__star {
  fill: currentColor;
}

.theme-toggle__core {
  fill: var(--color-accent);
}

.theme-toggle__crescent {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
}

.theme-toggle__edge {
  stroke: var(--color-accent);
  stroke-width: 1.4;
}

.theme-toggle__spokes,
.theme-toggle__dots {
  transform-origin: 12px 12px;
  transition: transform 420ms var(--ease-spring);
}

.theme-toggle:hover .theme-toggle__spokes,
.theme-toggle:hover .theme-toggle__dots {
  transform: rotate(30deg) scale(1.08);
}

.theme-toggle--day .theme-toggle__moon,
.theme-toggle--night .theme-toggle__sun {
  opacity: 0;
  transform: rotate(-90deg) scale(0.4);
}

.theme-toggle--day .theme-toggle__sun,
.theme-toggle--night .theme-toggle__moon {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}
</style>
