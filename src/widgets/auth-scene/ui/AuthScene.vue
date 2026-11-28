<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import {
  approach,
  buildNodes,
  driftOffset,
  litCount,
  litOrder,
  nearestEdges,
  nearestNode,
  repelOffset,
  type SceneEdge,
  type SceneNode,
  type ScenePoint,
} from "../lib/scene";

const props = withDefaults(
  defineProps<{
    progress?: number;
    state?: "idle" | "error" | "success";
  }>(),
  {
    progress: 0,
    state: "idle",
  },
);

const BASE_COUNT = 18;
const MAX_EXTRA = 12;
const NODE_RADIUS = 9;
// Как быстро вершины догоняют курсор и как быстро курсор начинает и перестаёт на них действовать.
const FOLLOW_RATE = 4;
const FADE_RATE = 3;

const baseNodes = buildNodes(BASE_COUNT, 11);
const baseEdges = nearestEdges(baseNodes, 2);
const baseOrder = litOrder(baseNodes, baseEdges, 0);

const extraNodes = ref<SceneNode[]>([]);
const extraEdges = ref<SceneEdge[]>([]);
const time = ref(0);
// pointer — где курсор сейчас; smoothPointer плавно его догоняет, и вершины расступаются
// вокруг smoothPointer. influence плавно растёт до 1, пока курсор над графом, и падает до 0,
// когда ушёл. Без этого вершины дёргались за быстрым курсором и прыгали на место при уходе.
const pointer = ref<ScenePoint | null>(null);
const smoothPointer = ref<ScenePoint | null>(null);
const influence = ref(0);
const svgElement = ref<SVGSVGElement | null>(null);
let frame = 0;
let lastFrame = 0;
let nextId = BASE_COUNT;

const nodes = computed(() => baseNodes.concat(extraNodes.value));
const edges = computed(() => baseEdges.concat(extraEdges.value));

const order = computed(() => {
  const result = baseOrder.slice();
  for (const node of extraNodes.value) {
    result.push(node.id);
  }
  return result;
});

const points = computed(() => {
  return nodes.value.map((node) => {
    const drift = driftOffset(node, time.value);
    const base = { x: node.x + drift.x, y: node.y + drift.y };
    const push = repelOffset(base, smoothPointer.value, influence.value);
    return { x: base.x + push.x, y: base.y + push.y };
  });
});

const pointById = computed(() => {
  const result: Record<number, ScenePoint> = {};
  for (let i = 0; i < nodes.value.length; i++) {
    result[nodes.value[i].id] = points.value[i];
  }
  return result;
});

const hotId = computed(() => {
  if (pointer.value === null) {
    return -1;
  }
  const index = nearestNode(points.value, pointer.value, 70);
  return index === -1 ? -1 : nodes.value[index].id;
});

const litIds = computed(() => {
  if (props.state === "success") {
    return order.value;
  }
  return order.value.slice(0, litCount(props.progress, order.value.length));
});

function isLit(id: number): boolean {
  return litIds.value.includes(id);
}

function waveDelay(id: number): string {
  if (props.state !== "success") {
    return "0ms";
  }
  return order.value.indexOf(id) * 45 + "ms";
}

function toScene(event: MouseEvent): ScenePoint | null {
  if (svgElement.value === null) {
    return null;
  }
  const matrix = svgElement.value.getScreenCTM();
  if (matrix === null) {
    return null;
  }
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: point.x, y: point.y };
}

function onPointerMove(event: PointerEvent) {
  pointer.value = toScene(event);
}

function onPointerLeave() {
  pointer.value = null;
}

function closestIds(point: ScenePoint, count: number): number[] {
  const list = nodes.value.map((node) => node.id);
  list.sort((first, second) => {
    const a = pointById.value[first];
    const b = pointById.value[second];
    return Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y);
  });
  return list.slice(0, count);
}

function onClick(event: MouseEvent) {
  const point = toScene(event);
  if (point === null) {
    return;
  }
  const node: SceneNode = {
    id: nextId,
    x: Math.round(point.x),
    y: Math.round(point.y),
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.5,
  };
  nextId = nextId + 1;
  const links = closestIds(point, 2).map((id) => ({ from: node.id, to: id }));
  let keptNodes = extraNodes.value.concat([node]);
  let keptEdges = extraEdges.value.concat(links);
  if (keptNodes.length > MAX_EXTRA) {
    const oldest = keptNodes[0].id;
    keptNodes = keptNodes.slice(1);
    keptEdges = keptEdges.filter((edge) => edge.from !== oldest && edge.to !== oldest);
  }
  extraNodes.value = keptNodes;
  extraEdges.value = keptEdges;
}

function followPointer(dt: number) {
  const target = pointer.value;
  if (target !== null) {
    const from = smoothPointer.value ?? target;
    smoothPointer.value = {
      x: approach(from.x, target.x, FOLLOW_RATE, dt),
      y: approach(from.y, target.y, FOLLOW_RATE, dt),
    };
    influence.value = approach(influence.value, 1, FADE_RATE, dt);
    return;
  }
  if (smoothPointer.value === null) {
    return;
  }
  influence.value = approach(influence.value, 0, FADE_RATE, dt);
  if (influence.value < 0.01) {
    influence.value = 0;
    smoothPointer.value = null;
  }
}

function tick(now: number) {
  const dt = lastFrame === 0 ? 0 : Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (motionAllowed()) {
    time.value = now / 1000;
  }
  followPointer(dt);
  frame = window.requestAnimationFrame(tick);
}

onMounted(() => {
  if (typeof window.requestAnimationFrame === "function") {
    frame = window.requestAnimationFrame(tick);
  }
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frame);
});
</script>

<template>
  <div class="auth-scene" :class="'auth-scene--' + state">
    <svg
      ref="svgElement"
      class="auth-scene__svg"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @click="onClick"
    >
      <line
        v-for="edge in edges"
        :key="edge.from + '-' + edge.to"
        class="auth-scene__edge"
        :class="{
          'auth-scene__edge--lit': isLit(edge.from) && isLit(edge.to),
          'auth-scene__edge--hot': hotId === edge.from || hotId === edge.to,
        }"
        :x1="pointById[edge.from].x"
        :y1="pointById[edge.from].y"
        :x2="pointById[edge.to].x"
        :y2="pointById[edge.to].y"
      />
      <circle
        v-for="(node, index) in nodes"
        :key="node.id"
        class="auth-scene__node"
        :class="{
          'auth-scene__node--lit': isLit(node.id),
          'auth-scene__node--hot': hotId === node.id,
          'auth-scene__node--fresh': node.id >= BASE_COUNT,
        }"
        :cx="points[index].x"
        :cy="points[index].y"
        :r="hotId === node.id ? NODE_RADIUS + 2 : NODE_RADIUS"
        :style="{ animationDelay: waveDelay(node.id) }"
      />
    </svg>
    <div class="auth-scene__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-scene {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 25% 20%,
      color-mix(in srgb, var(--color-accent) 22%, transparent),
      transparent 60%
    ),
    radial-gradient(
      circle at 85% 90%,
      color-mix(in srgb, var(--graph-active) 14%, transparent),
      transparent 55%
    ),
    var(--graph-canvas-bg);
}

.auth-scene__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.auth-scene__content {
  position: relative;
  height: 100%;
  pointer-events: none;
}

.auth-scene__content :deep(a),
.auth-scene__content :deep(button) {
  pointer-events: auto;
}

.auth-scene__edge {
  stroke: var(--graph-edge);
  stroke-width: 1.5;
  stroke-opacity: 0.35;
  vector-effect: non-scaling-stroke;
  transition:
    stroke var(--duration) var(--ease-out),
    stroke-opacity var(--duration) var(--ease-out);
}

.auth-scene__edge--lit {
  stroke: var(--color-accent);
  stroke-opacity: 0.9;
  stroke-width: 2.5;
}

.auth-scene__edge--hot {
  stroke-opacity: 0.8;
}

.auth-scene__node {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center;
  transition:
    fill var(--duration) var(--ease-out),
    stroke var(--duration) var(--ease-out),
    r var(--duration) var(--ease-out);
}

.auth-scene__node--lit {
  fill: var(--color-accent);
  stroke: var(--color-accent);
  filter: drop-shadow(0 0 6px var(--color-accent));
}

.auth-scene__node--hot {
  stroke: var(--color-accent);
}

.auth-scene__node--fresh {
  animation: auth-scene-pop 500ms var(--ease-spring);
}

.auth-scene--error .auth-scene__svg {
  animation: auth-scene-shake 420ms linear;
}

.auth-scene--error .auth-scene__node--lit {
  fill: var(--color-danger);
  stroke: var(--color-danger);
  filter: drop-shadow(0 0 6px var(--color-danger));
}

.auth-scene--error .auth-scene__edge--lit {
  stroke: var(--color-danger);
}

.auth-scene--success .auth-scene__node {
  animation: auth-scene-wave 600ms var(--ease-out) both;
}

@keyframes auth-scene-pop {
  from {
    transform: scale(0);
  }
}

@keyframes auth-scene-wave {
  40% {
    transform: scale(1.7);
  }
}

@keyframes auth-scene-shake {
  20% {
    transform: translateX(-10px);
  }
  40% {
    transform: translateX(9px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-scene__node--fresh,
  .auth-scene--error .auth-scene__svg,
  .auth-scene--success .auth-scene__node {
    animation: none;
  }
}
</style>
