<script setup lang="ts">
import { computed } from "vue";
import { isMotionOff, setMotionOff } from "@/shared/lib/motion";

const off = computed(() => isMotionOff());

const title = computed(() =>
  off.value ? "Выключить спокойный режим" : "Спокойный режим: без анимаций и украшений",
);

function onToggle() {
  setMotionOff(!off.value);
}
</script>

<template>
  <button
    type="button"
    class="motion-toggle"
    :class="{ 'motion-toggle--off': off }"
    :title="title"
    :aria-label="title"
    :aria-pressed="off"
    @click="onToggle"
  >
    <svg class="motion-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path class="motion-toggle__wave" d="M3 14 C6 8, 9 8, 12 12 S18 16, 21 10" />
      <circle class="motion-toggle__dot" cx="21" cy="10" r="1.8" />
      <line class="motion-toggle__slash" x1="4" y1="20" x2="20" y2="4" />
    </svg>
  </button>
</template>

<style scoped>
.motion-toggle {
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
    background-color var(--duration) var(--ease-out);
}

.motion-toggle:hover {
  background: var(--color-surface-hover);
  transform: translateY(-1px);
}

.motion-toggle:active {
  transform: scale(0.94);
}

.motion-toggle:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.motion-toggle__icon {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.motion-toggle__dot {
  fill: var(--color-accent);
  stroke: none;
}

.motion-toggle__wave {
  stroke-dasharray: 24;
  stroke-dashoffset: 0;
}

.motion-toggle:hover .motion-toggle__wave {
  animation: motion-toggle-wave 700ms var(--ease-out);
}

.motion-toggle__slash {
  stroke: var(--color-danger);
  stroke-width: 2;
  opacity: 0;
}

.motion-toggle--off {
  color: var(--color-text-muted);
}

.motion-toggle--off .motion-toggle__slash {
  opacity: 1;
}

.motion-toggle--off .motion-toggle__dot {
  fill: var(--color-text-muted);
}

@keyframes motion-toggle-wave {
  from {
    stroke-dashoffset: 24;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
