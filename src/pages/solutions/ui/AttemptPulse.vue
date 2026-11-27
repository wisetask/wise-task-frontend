<script setup lang="ts">
import { computed } from "vue";
import { pulsePath } from "../model/sideViews";

const PULSE_WIDTH = 190;
const PULSE_HEIGHT = 26;

const props = defineProps<{
  attempts: { isCorrect: boolean }[];
  index?: number;
}>();

const path = computed(() => pulsePath(props.attempts, PULSE_WIDTH, PULSE_HEIGHT));
const delay = computed(() => (props.index === undefined ? 0 : props.index) * 300 + "ms");
</script>

<template>
  <svg
    class="pulse"
    :viewBox="'0 0 ' + PULSE_WIDTH + ' ' + PULSE_HEIGHT"
    aria-hidden="true"
    :style="{ '--pulse-delay': delay }"
  >
    <line
      class="pulse__base"
      x1="0"
      :y1="PULSE_HEIGHT / 2"
      :x2="PULSE_WIDTH"
      :y2="PULSE_HEIGHT / 2"
    />
    <path class="pulse__line" :d="path" pathLength="1" />
    <circle class="pulse__wait" :cx="PULSE_WIDTH - 3" :cy="PULSE_HEIGHT / 2" r="2.6" />
  </svg>
</template>

<style scoped>
.pulse {
  display: block;
  width: 100%;
  height: 26px;
  overflow: visible;
}

.pulse__base {
  stroke: var(--color-border);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}

.pulse__line {
  fill: none;
  stroke: var(--color-danger);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--color-danger) 60%, transparent));
  animation: pulse-run 3.2s linear var(--pulse-delay) infinite;
}

.pulse__wait {
  fill: var(--graph-active);
  animation: pulse-wait 1s ease-in-out infinite;
}

@keyframes pulse-run {
  0% {
    stroke-dashoffset: 1;
    opacity: 1;
  }
  65% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  90% {
    stroke-dashoffset: 0;
    opacity: 0.35;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

@keyframes pulse-wait {
  50% {
    opacity: 0.2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pulse__line,
  .pulse__wait {
    animation: none !important;
  }
}
</style>
