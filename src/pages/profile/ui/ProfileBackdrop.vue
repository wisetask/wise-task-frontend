<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import {
  TREE_HEIGHT,
  TREE_WIDTH,
  cloudPoints,
  primTree,
  type TreeEdge,
  type TreePoint,
} from "../lib/primTree";

const POINT_COUNT = 34;
const MIN_GAP = 150;
const FIRST_SEED = 20261128;
const EDGE_TIME = 320;
const HOLD_TIME = 3500;
const FADE_TIME = 1400;

interface Growth {
  key: number;
  points: TreePoint[];
  edges: TreeEdge[];
  litAt: number[];
}

let seed = FIRST_SEED;
let growthCount = 0;
let cycleTimer = 0;
let fadeTimer = 0;

const lively = computed(() => motionAllowed());
const growth = shallowRef<Growth>(makeGrowth(seed));
const fading = shallowRef(false);

function makeGrowth(currentSeed: number): Growth {
  const points = cloudPoints(POINT_COUNT, currentSeed, MIN_GAP);
  const start = Math.floor(points.length / 2);
  const edges = primTree(points, start);
  const litAt: number[] = [];
  for (let i = 0; i < points.length; i++) {
    litAt.push(0);
  }
  for (let i = 0; i < edges.length; i++) {
    litAt[edges[i].to] = (i + 1) * EDGE_TIME;
  }
  growthCount = growthCount + 1;
  return { key: growthCount, points: points, edges: edges, litAt: litAt };
}

function stop() {
  window.clearTimeout(cycleTimer);
  window.clearTimeout(fadeTimer);
}

function scheduleCycle() {
  stop();
  const growTime = growth.value.edges.length * EDGE_TIME;
  cycleTimer = window.setTimeout(() => {
    fading.value = true;
    fadeTimer = window.setTimeout(() => {
      if (!lively.value || document.hidden) {
        fading.value = false;
        scheduleCycle();
        return;
      }
      seed = seed + 1;
      growth.value = makeGrowth(seed);
      fading.value = false;
      scheduleCycle();
    }, FADE_TIME);
  }, growTime + HOLD_TIME);
}

watch(lively, (value) => {
  if (value) {
    growth.value = makeGrowth(seed);
    scheduleCycle();
  } else {
    stop();
    fading.value = false;
  }
});

onMounted(() => {
  if (lively.value) {
    scheduleCycle();
  }
});

onBeforeUnmount(stop);
</script>

<template>
  <div class="tree-backdrop" aria-hidden="true">
    <svg
      class="tree-backdrop__svg"
      :viewBox="'0 0 ' + TREE_WIDTH + ' ' + TREE_HEIGHT"
      preserveAspectRatio="xMidYMid slice"
    >
      <g
        :key="growth.key"
        class="tree-backdrop__world"
        :class="{
          'tree-backdrop__world--still': !lively,
          'tree-backdrop__world--fading': fading,
        }"
      >
        <line
          v-for="(edge, index) in growth.edges"
          :key="'edge-' + index"
          class="tree-backdrop__edge"
          :x1="growth.points[edge.from].x"
          :y1="growth.points[edge.from].y"
          :x2="growth.points[edge.to].x"
          :y2="growth.points[edge.to].y"
          pathLength="1"
          :style="{ '--delay': index * EDGE_TIME + 'ms' }"
        />
        <circle
          v-for="(point, index) in growth.points"
          :key="'point-' + index"
          class="tree-backdrop__point"
          :cx="point.x"
          :cy="point.y"
          r="6"
          :style="{ '--lit': growth.litAt[index] + 'ms' }"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.tree-backdrop {
  position: fixed;
  top: var(--header-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.55;
  mask-image: radial-gradient(ellipse at 50% 35%, rgb(0 0 0 / 30%) 25%, black 75%);
}

.tree-backdrop__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.tree-backdrop__world {
  transition: opacity 1.4s var(--ease-out);
}

.tree-backdrop__world--fading {
  opacity: 0;
}

.tree-backdrop__edge {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  stroke-opacity: 0.45;
  animation: tree-grow 900ms var(--ease-out) var(--delay) forwards;
}

.tree-backdrop__point {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 1.5;
  opacity: 0.45;
  transform-box: fill-box;
  transform-origin: center;
  animation: tree-lit 1.2s var(--ease-out) var(--lit) forwards;
}

.tree-backdrop__world--still .tree-backdrop__edge {
  stroke-dashoffset: 0;
  animation: none;
}

.tree-backdrop__world--still .tree-backdrop__point {
  fill: color-mix(in srgb, var(--color-accent) 25%, var(--graph-vertex-fill));
  stroke: var(--color-accent);
  opacity: 0.8;
  animation: none;
}

@keyframes tree-grow {
  0% {
    stroke-dashoffset: 1;
    stroke-opacity: 0.9;
    stroke-width: 3;
  }
  60% {
    stroke-dashoffset: 0;
    stroke-opacity: 0.9;
    stroke-width: 3;
  }
  100% {
    stroke-dashoffset: 0;
    stroke-opacity: 0.45;
    stroke-width: 1.6;
  }
}

@keyframes tree-lit {
  0% {
    opacity: 0.45;
    transform: scale(1);
  }
  30% {
    fill: color-mix(in srgb, var(--color-accent) 45%, var(--graph-vertex-fill));
    stroke: var(--color-accent);
    opacity: 1;
    transform: scale(1.7);
  }
  100% {
    fill: color-mix(in srgb, var(--color-accent) 25%, var(--graph-vertex-fill));
    stroke: var(--color-accent);
    opacity: 0.8;
    transform: scale(1);
  }
}
</style>
