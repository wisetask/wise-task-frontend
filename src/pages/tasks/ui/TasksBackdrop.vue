<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import { latticeEdges, latticePoints, PAINT_HEIGHT, PAINT_WIDTH } from "../model/coloringBackdrop";
import {
  buildRun,
  nextKind,
  SHOWCASE_SEED,
  showcaseForCategory,
  type ShowcaseRun,
} from "../model/showcase";

const props = defineProps<{ category: string }>();

const HOLD_TIME = 3200;
const FADE_TIME = 1000;
const FIRST_RUN = 900;
const TRY_TIME = 120;

const points = latticePoints(SHOWCASE_SEED);
const edges = latticeEdges(points);
const run = shallowRef<ShowcaseRun | null>(null);
const runKey = ref(0);
const fading = ref(false);
let runCount = 0;
let runTimer = 0;
let fadeTimer = 0;

function startRun() {
  window.clearTimeout(runTimer);
  window.clearTimeout(fadeTimer);
  if (!motionAllowed() || document.hidden) {
    run.value = null;
    runTimer = window.setTimeout(startRun, 1500);
    return;
  }
  const kind = nextKind(runCount, props.category);
  const start = Math.floor(Math.random() * points.length);
  const next = buildRun(kind, points, edges, start);
  runCount = runCount + 1;
  runKey.value = runKey.value + 1;
  fading.value = false;
  run.value = next;
  fadeTimer = window.setTimeout(() => {
    fading.value = true;
  }, next.duration + HOLD_TIME);
  runTimer = window.setTimeout(startRun, next.duration + HOLD_TIME + FADE_TIME);
}

function edgeStyle(index: number): Record<string, string> {
  if (run.value === null) {
    return {};
  }
  return { "--delay": run.value.edgeDelay[index] + "ms" };
}

function vertexStyle(index: number): Record<string, string> {
  if (run.value === null) {
    return {};
  }
  const tries = run.value.vertexTries[index];
  return {
    "--delay": run.value.vertexDelay[index] + "ms",
    "--paint-delay": run.value.vertexDelay[index] + tries * TRY_TIME + "ms",
    "--tries": String(tries),
  };
}

watch(
  () => props.category,
  (now, before) => {
    if (showcaseForCategory(now) !== showcaseForCategory(before)) {
      startRun();
    }
  },
);

onMounted(() => {
  runTimer = window.setTimeout(startRun, FIRST_RUN);
});

onBeforeUnmount(() => {
  window.clearTimeout(runTimer);
  window.clearTimeout(fadeTimer);
});
</script>

<template>
  <div class="showcase" :class="run === null ? '' : 'showcase--' + run.kind" aria-hidden="true">
    <svg
      class="showcase__svg"
      :viewBox="'0 0 ' + PAINT_WIDTH + ' ' + PAINT_HEIGHT"
      preserveAspectRatio="xMidYMid slice"
    >
      <g class="showcase__base">
        <line
          v-for="(edge, index) in edges"
          :key="'base-edge-' + index"
          class="showcase__base-edge"
          :x1="points[edge[0]].x"
          :y1="points[edge[0]].y"
          :x2="points[edge[1]].x"
          :y2="points[edge[1]].y"
        />
        <circle
          v-for="(point, index) in points"
          :key="'base-vertex-' + index"
          class="showcase__base-vertex"
          :cx="point.x"
          :cy="point.y"
          r="6"
        />
      </g>
      <g
        v-if="run !== null"
        :key="runKey"
        class="showcase__run"
        :class="{ 'showcase__run--fading': fading }"
      >
        <template v-for="(edge, index) in edges" :key="'edge-' + index">
          <line
            v-if="run.edgeState[index] !== ''"
            class="showcase__edge"
            :class="'showcase__edge--' + run.edgeState[index]"
            :x1="points[edge[0]].x"
            :y1="points[edge[0]].y"
            :x2="points[edge[1]].x"
            :y2="points[edge[1]].y"
            pathLength="1"
            :style="edgeStyle(index)"
          />
        </template>
        <template v-for="(point, index) in points" :key="'vertex-' + index">
          <g v-if="run.vertexColor[index] >= 0" :style="vertexStyle(index)">
            <circle
              v-if="run.vertexTries[index] > 0"
              class="showcase__try"
              :cx="point.x"
              :cy="point.y"
              r="9"
            />
            <circle
              class="showcase__paint"
              :class="'showcase__paint--' + run.vertexColor[index]"
              :cx="point.x"
              :cy="point.y"
              r="8"
            />
          </g>
        </template>
      </g>
    </svg>
    <p v-if="run !== null" :key="runKey" class="showcase__caption">
      <span class="showcase__caption-dot" />
      {{ run.caption }}
    </p>
  </div>
</template>

<style scoped>
.showcase {
  --run: var(--color-accent);

  position: fixed;
  top: var(--header-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  pointer-events: none;
  animation: showcase-in 1.2s var(--ease-out) backwards;
}

.showcase--tree {
  --run: var(--color-success);
}

.showcase--matching {
  --run: var(--graph-active);
}

.showcase__svg {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.55;
  mask-image: radial-gradient(ellipse at 50% 45%, rgb(0 0 0 / 25%) 30%, black 80%);
}

.showcase__base-edge {
  stroke: var(--graph-edge);
  stroke-width: 1;
  opacity: 0.25;
}

.showcase__base-vertex {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 1.2;
  opacity: 0.45;
}

.showcase__run {
  transition: opacity 1s var(--ease-out);
}

.showcase__run--fading {
  opacity: 0;
}

.showcase__edge {
  stroke-linecap: round;
  stroke-dasharray: 1;
}

.showcase__edge--on {
  stroke: var(--run);
  stroke-width: 3;
  opacity: 0.85;
  animation: showcase-draw 420ms var(--ease-out) var(--delay) backwards;
}

.showcase--matching .showcase__edge--on {
  stroke-width: 6;
}

.showcase__edge--off {
  stroke: var(--color-danger);
  stroke-width: 2.5;
  opacity: 0;
  animation: showcase-off 700ms var(--ease-out) var(--delay) backwards;
}

.showcase__paint {
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: showcase-pop 460ms var(--ease-spring) var(--paint-delay) backwards;
}

.showcase__paint--0 {
  fill: var(--graph-blue-fill);
  stroke: var(--graph-blue-stroke);
}

.showcase__paint--1 {
  fill: var(--graph-green-fill);
  stroke: var(--graph-green-stroke);
}

.showcase__paint--2 {
  fill: color-mix(in srgb, var(--graph-active) 25%, var(--graph-vertex-fill));
  stroke: var(--graph-active);
}

.showcase__paint--3 {
  fill: var(--graph-red-fill);
  stroke: var(--graph-red-stroke);
}

.showcase__try {
  fill: none;
  stroke: var(--color-danger);
  stroke-width: 2;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: showcase-try 120ms linear var(--delay) var(--tries);
}

.showcase__caption {
  position: absolute;
  bottom: var(--space-4);
  left: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: calc(100vw - 2 * var(--space-4));
  margin: 0;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 80%, transparent);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-style: italic;
  animation: showcase-caption 600ms var(--ease-out) 300ms backwards;
}

.showcase__caption-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--run);
}

@keyframes showcase-in {
  from {
    opacity: 0;
  }
}

@keyframes showcase-draw {
  from {
    stroke-dashoffset: 1;
  }
}

@keyframes showcase-off {
  0% {
    opacity: 0;
  }
  30% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}

@keyframes showcase-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}

@keyframes showcase-try {
  0% {
    opacity: 0.9;
    transform: scale(0.8);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

@keyframes showcase-caption {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
