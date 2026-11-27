<script setup lang="ts">
import { computed } from "vue";
import { starLeaves } from "../model/sideViews";

const STAR_SIZE = 60;
const STAR_RADIUS = 21;

const props = withDefaults(
  defineProps<{
    attempts: { isCorrect: boolean }[];
    solved?: boolean;
  }>(),
  {
    solved: false,
  },
);

const center = STAR_SIZE / 2;
const leaves = computed(() => starLeaves(props.attempts, center, STAR_RADIUS));

function leafDelay(index: number): Record<string, string> {
  return { animationDelay: 200 + index * 70 + "ms" };
}
</script>

<template>
  <svg
    class="star"
    :class="{ 'star--solved': solved }"
    :viewBox="'0 0 ' + STAR_SIZE + ' ' + STAR_SIZE"
    aria-hidden="true"
  >
    <g class="star__spin">
      <line
        v-for="(leaf, index) in leaves"
        :key="'edge-' + index"
        class="star__edge"
        :x1="center"
        :y1="center"
        :x2="leaf.x"
        :y2="leaf.y"
        pathLength="1"
        :style="leafDelay(index)"
      />
      <circle
        v-for="(leaf, index) in leaves"
        :key="'leaf-' + index"
        class="star__leaf"
        :class="{
          'star__leaf--ok': leaf.isCorrect,
          'star__leaf--last': index === leaves.length - 1,
        }"
        :cx="leaf.x"
        :cy="leaf.y"
        r="4"
        :style="leafDelay(index)"
      />
    </g>
    <circle class="star__center" :cx="center" :cy="center" r="7" />
  </svg>
</template>

<style scoped>
.star {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  overflow: visible;
}

.star__spin {
  transform-box: view-box;
  transform-origin: center;
  animation: star-spin 26s linear infinite;
}

.star__edge {
  stroke: var(--graph-edge);
  stroke-width: 1.3;
  stroke-dasharray: 1;
  animation: star-draw 420ms var(--ease-out) backwards;
}

.star__leaf {
  fill: var(--color-danger);
  stroke: var(--color-surface);
  stroke-width: 1.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: star-pop 420ms var(--ease-spring) backwards;
}

.star__leaf--ok {
  fill: var(--color-success);
}

.star__leaf--last {
  animation:
    star-pop 420ms var(--ease-spring) backwards,
    star-ping 1.8s var(--ease-out) 1.2s infinite;
}

.star__center {
  fill: var(--graph-red-fill);
  stroke: var(--graph-active);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: star-breathe 2.4s ease-in-out infinite;
}

.star--solved .star__center {
  fill: var(--graph-green-fill);
  stroke: var(--color-success);
}

@keyframes star-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes star-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes star-pop {
  from {
    opacity: 0;
    transform: scale(0);
  }
}

@keyframes star-ping {
  0%,
  100% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.6);
  }
}

@keyframes star-breathe {
  50% {
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .star__spin,
  .star__leaf--last,
  .star__center {
    animation: none !important;
  }
}
</style>
