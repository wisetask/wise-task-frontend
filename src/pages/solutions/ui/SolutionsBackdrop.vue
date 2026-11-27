<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import {
  BACKDROP_HEIGHT,
  BACKDROP_WIDTH,
  backdropPoints,
  breadthFirst,
  farthestNode,
  nearestEdges,
  pathLine,
  pathTo,
} from "../model/backdropGraph";

const SEED = 20261127;
const NEIGHBOURS = 3;
const STEP_TIME = 260;
const PATH_TIME = 1400;
const HOLD_TIME = 1800;
const PAUSE_TIME = 1400;
const FIRST_WAVE = 900;

interface Wave {
  key: number;
  layer: number[];
  parent: number[];
  path: number[];
  line: string;
  pathDelay: number;
  start: number;
  target: number;
}

const points = backdropPoints(SEED);
const edges = nearestEdges(points, NEIGHBOURS);
const wave = shallowRef<Wave | null>(null);
const shift = ref({ x: 0, y: 0 });
const token = ref<SVGAnimateMotionElement | null>(null);
let waveCount = 0;
let waveTimer = 0;
let tokenTimer = 0;
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;

function startWave() {
  if (!motionAllowed() || document.hidden) {
    waveTimer = window.setTimeout(startWave, PAUSE_TIME);
    return;
  }
  const start = Math.floor(Math.random() * points.length);
  const result = breadthFirst(points.length, edges, start);
  const target = farthestNode(result.layer);
  const path = pathTo(result.parent, target);
  const pathDelay = result.layer[target] * STEP_TIME + 300;
  waveCount = waveCount + 1;
  wave.value = {
    key: waveCount,
    layer: result.layer,
    parent: result.parent,
    path: path,
    line: pathLine(points, path),
    pathDelay: pathDelay,
    start: start,
    target: target,
  };
  window.clearTimeout(tokenTimer);
  tokenTimer = window.setTimeout(() => {
    if (token.value !== null && typeof token.value.beginElement === "function") {
      token.value.beginElement();
    }
  }, pathDelay);
  waveTimer = window.setTimeout(startWave, pathDelay + PATH_TIME + HOLD_TIME + PAUSE_TIME);
}

function nodeStyle(index: number): Record<string, string> {
  const style: Record<string, string> = { "--twinkle": ((index * 0.53) % 4) + "s" };
  if (wave.value !== null && wave.value.layer[index] >= 0) {
    style["--lit"] = wave.value.layer[index] * STEP_TIME + "ms";
  }
  return style;
}

function nodeClass(index: number): Record<string, boolean> {
  const current = wave.value;
  return {
    "backdrop__node--lit": current !== null && current.layer[index] >= 0,
    "backdrop__node--start": current !== null && current.start === index,
    "backdrop__node--target": current !== null && current.target === index,
    "backdrop__node--path": current !== null && current.path.includes(index),
  };
}

function isTreeEdge(edge: number[]): boolean {
  const current = wave.value;
  if (current === null) {
    return false;
  }
  return current.parent[edge[1]] === edge[0] || current.parent[edge[0]] === edge[1];
}

function edgeStyle(edge: number[]): Record<string, string> {
  const current = wave.value;
  if (current === null) {
    return {};
  }
  const layer = Math.max(current.layer[edge[0]], current.layer[edge[1]]);
  return { "--lit": Math.max(layer - 1, 0) * STEP_TIME + "ms" };
}

function onPointerMove(event: PointerEvent) {
  pointerX = event.clientX / window.innerWidth - 0.5;
  pointerY = event.clientY / window.innerHeight - 0.5;
  if (pointerFrame !== 0) {
    return;
  }
  pointerFrame = window.requestAnimationFrame(() => {
    pointerFrame = 0;
    shift.value = { x: Math.round(-pointerX * 28), y: Math.round(-pointerY * 20) };
  });
}

onMounted(() => {
  waveTimer = window.setTimeout(startWave, FIRST_WAVE);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
});

onBeforeUnmount(() => {
  window.clearTimeout(waveTimer);
  window.clearTimeout(tokenTimer);
  window.cancelAnimationFrame(pointerFrame);
  window.removeEventListener("pointermove", onPointerMove);
});
</script>

<template>
  <div class="backdrop" aria-hidden="true">
    <svg
      class="backdrop__svg"
      :viewBox="'0 0 ' + BACKDROP_WIDTH + ' ' + BACKDROP_HEIGHT"
      preserveAspectRatio="xMidYMid slice"
    >
      <g
        class="backdrop__world"
        :style="{ transform: 'translate(' + shift.x + 'px, ' + shift.y + 'px)' }"
      >
        <g :key="wave === null ? 0 : wave.key">
          <line
            v-for="(edge, index) in edges"
            :key="'edge-' + index"
            class="backdrop__edge"
            :class="{ 'backdrop__edge--tree': isTreeEdge(edge) }"
            :x1="points[edge[0]].x"
            :y1="points[edge[0]].y"
            :x2="points[edge[1]].x"
            :y2="points[edge[1]].y"
            :style="edgeStyle(edge)"
          />
          <path
            v-if="wave !== null"
            class="backdrop__path"
            :d="wave.line"
            pathLength="1"
            :style="{ '--path-delay': wave.pathDelay + 'ms' }"
          />
          <g
            v-for="(point, index) in points"
            :key="'node-' + index"
            class="backdrop__node"
            :class="nodeClass(index)"
            :style="nodeStyle(index)"
          >
            <circle class="backdrop__ring" :cx="point.x" :cy="point.y" r="16" />
            <circle class="backdrop__dot" :cx="point.x" :cy="point.y" r="6" />
          </g>
          <circle
            v-if="wave !== null"
            class="backdrop__token"
            r="6"
            cx="0"
            cy="0"
            :style="{ '--path-delay': wave.pathDelay + 'ms' }"
          >
            <animateMotion
              ref="token"
              :path="wave.line"
              :dur="PATH_TIME + 'ms'"
              begin="indefinite"
              fill="freeze"
            />
          </circle>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  top: var(--header-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.6;
  mask-image: radial-gradient(ellipse at 50% 40%, rgb(0 0 0 / 35%) 25%, black 75%);
  animation: backdrop-in 1.2s var(--ease-out) backwards;
}

.backdrop__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.backdrop__world {
  transition: transform 900ms var(--ease-out);
}

.backdrop__edge {
  stroke: var(--graph-edge);
  stroke-width: 1.2;
  opacity: 0.35;
}

.backdrop__edge--tree {
  animation: backdrop-tree 2.4s var(--ease-out) var(--lit) both;
}

.backdrop__dot {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 1.5;
  opacity: 0.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: backdrop-twinkle 4s ease-in-out var(--twinkle) infinite;
}

.backdrop__node--lit .backdrop__dot {
  animation: backdrop-lit 2.2s var(--ease-out) var(--lit) both;
}

.backdrop__node--path .backdrop__dot {
  animation: backdrop-path-dot 5s var(--ease-out) var(--lit) both;
}

.backdrop__ring {
  fill: none;
  stroke-width: 2;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
}

.backdrop__node--start .backdrop__ring {
  stroke: var(--color-accent);
  animation: backdrop-ping 1.4s var(--ease-out) 2;
}

.backdrop__node--target .backdrop__ring {
  stroke: var(--color-success);
  animation: backdrop-ping 1.4s var(--ease-out) var(--lit) 3;
}

.backdrop__path {
  fill: none;
  stroke: var(--color-success);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
  animation: backdrop-path 4.6s var(--ease-out) var(--path-delay) forwards;
}

.backdrop__token {
  fill: var(--graph-active);
  animation: backdrop-token 4.6s linear var(--path-delay) both;
}

@keyframes backdrop-token {
  0% {
    opacity: 0;
  }
  2%,
  75% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes backdrop-twinkle {
  50% {
    opacity: 0.8;
  }
}

@keyframes backdrop-lit {
  0% {
    fill: var(--graph-vertex-fill);
    stroke: var(--graph-vertex-stroke);
    opacity: 0.5;
    transform: scale(1);
  }
  15% {
    fill: color-mix(in srgb, var(--color-accent) 40%, var(--graph-vertex-fill));
    stroke: var(--color-accent);
    opacity: 1;
    transform: scale(1.6);
  }
  100% {
    fill: var(--graph-vertex-fill);
    stroke: var(--graph-vertex-stroke);
    opacity: 0.5;
    transform: scale(1);
  }
}

@keyframes backdrop-path-dot {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  8% {
    stroke: var(--color-accent);
    opacity: 1;
    transform: scale(1.6);
  }
  45%,
  80% {
    fill: var(--graph-green-fill);
    stroke: var(--color-success);
    opacity: 1;
    transform: scale(1.3);
  }
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
}

@keyframes backdrop-tree {
  0% {
    stroke: var(--graph-edge);
    opacity: 0.35;
  }
  20% {
    stroke: var(--color-accent);
    stroke-width: 2.4;
    opacity: 0.9;
  }
  100% {
    stroke: var(--graph-edge);
    opacity: 0.35;
  }
}

@keyframes backdrop-path {
  0% {
    stroke-dashoffset: 1;
    opacity: 0.95;
  }
  30% {
    stroke-dashoffset: 0;
    opacity: 0.95;
  }
  75% {
    stroke-dashoffset: 0;
    opacity: 0.95;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

@keyframes backdrop-ping {
  from {
    opacity: 0.9;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(1.8);
  }
}
</style>
