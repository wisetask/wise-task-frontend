<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import {
  BLUEPRINT_HEIGHT,
  BLUEPRINT_WIDTH,
  coordLabel,
  GRID_STEP,
  nextSketch,
  sketchPlan,
  sketchSpot,
  SKETCH_TITLES,
  type SketchPlan,
} from "../model/blueprint";
import type { SketchId } from "../model/constructorEggs";
import { pluralize } from "../model/taskDraft";

const props = withDefaults(
  defineProps<{
    lively: boolean;
    title: string;
    category: string;
    vertices: number | null;
    checks: number;
    special?: SketchId | "";
    specialKey?: number;
  }>(),
  {
    special: "",
    specialKey: 0,
  },
);

const HOLD_TIME = 2600;
const FADE_TIME = 900;
const STROKE_TIME = 2400;
const FIRST_SKETCH = 700;

interface Sketch {
  key: number;
  id: SketchId;
  plan: SketchPlan;
  life: number;
  caption: string;
}

const sketch = shallowRef<Sketch | null>(null);
const shift = ref({ x: 0, y: 0 });
const cross = ref({ x: 0, y: 0, visible: false });
const backdrop = ref<HTMLElement | null>(null);
let sketchCount = 0;
let sketchTimer = 0;
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;
let pendingSpecial: SketchId | "" = "";

const today = new Date().toLocaleDateString("ru-RU");

const stampRows = computed(() => {
  const rows: string[][] = [];
  rows.push(["Чертёж", props.title]);
  rows.push(["Раздел", props.category.trim() === "" ? "не указан" : props.category.trim()]);
  if (props.vertices === null) {
    rows.push(["Граф", "рисует студент"]);
  } else {
    rows.push(["Граф", pluralize(props.vertices, "вершина", "вершины", "вершин")]);
  }
  rows.push(["Проверки", String(props.checks)]);
  rows.push(["Дата", today]);
  return rows;
});

function captionFor(id: SketchId, plan: SketchPlan): string {
  if (id === "envelope") {
    return SKETCH_TITLES[id];
  }
  const vertices = pluralize(plan.vertices.length, "вершина", "вершины", "вершин");
  const edges = pluralize(plan.edges.length, "ребро", "ребра", "рёбер");
  return SKETCH_TITLES[id] + ": " + vertices + ", " + edges;
}

function drawNext() {
  window.clearTimeout(sketchTimer);
  if (!props.lively || !motionAllowed() || document.hidden) {
    sketch.value = null;
    sketchTimer = window.setTimeout(drawNext, 1500);
    return;
  }
  const id = nextSketch(sketchCount, pendingSpecial);
  pendingSpecial = "";
  const spot = sketchSpot(sketchCount);
  const scale = id === "envelope" ? 0.9 : 0.62 + (sketchCount % 3) * 0.08;
  const plan = sketchPlan(id, spot[0], spot[1], scale);
  let life = plan.duration + HOLD_TIME + FADE_TIME;
  if (plan.stroke !== "") {
    life = life + STROKE_TIME;
  }
  sketchCount = sketchCount + 1;
  sketch.value = {
    key: sketchCount,
    id: id,
    plan: plan,
    life: life,
    caption: captionFor(id, plan),
  };
  sketchTimer = window.setTimeout(drawNext, life + 400);
}

function strokeDelay(plan: SketchPlan): number {
  if (plan.vertices.length === 0) {
    return 0;
  }
  return plan.vertices[plan.vertices.length - 1].delay + 300;
}

function penStyle(plan: SketchPlan): Record<string, string> {
  return {
    offsetPath: 'path("' + plan.stroke + '")',
    "--delay": strokeDelay(plan) + "ms",
  };
}

function onPointerMove(event: PointerEvent) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (pointerFrame !== 0) {
    return;
  }
  pointerFrame = window.requestAnimationFrame(() => {
    pointerFrame = 0;
    const width = window.innerWidth;
    const height = window.innerHeight;
    shift.value = {
      x: Math.round((0.5 - pointerX / width) * 24),
      y: Math.round((0.5 - pointerY / height) * 16),
    };
    if (backdrop.value === null) {
      return;
    }
    const box = backdrop.value.getBoundingClientRect();
    const x = Math.round((pointerX - box.left) / GRID_STEP) * GRID_STEP;
    const y = Math.round((pointerY - box.top) / GRID_STEP) * GRID_STEP;
    cross.value = { x: x, y: y, visible: y >= 0 };
  });
}

function onPointerLeave() {
  cross.value = { x: cross.value.x, y: cross.value.y, visible: false };
}

watch(
  () => props.specialKey,
  () => {
    if (props.special === "") {
      return;
    }
    pendingSpecial = props.special;
    drawNext();
  },
);

watch(
  () => props.lively,
  (lively) => {
    if (!lively) {
      sketch.value = null;
    }
  },
);

onMounted(() => {
  sketchTimer = window.setTimeout(drawNext, FIRST_SKETCH);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
});

onBeforeUnmount(() => {
  window.clearTimeout(sketchTimer);
  window.cancelAnimationFrame(pointerFrame);
  window.removeEventListener("pointermove", onPointerMove);
  document.documentElement.removeEventListener("pointerleave", onPointerLeave);
});
</script>

<template>
  <div ref="backdrop" class="blueprint" aria-hidden="true">
    <div
      class="blueprint__grid"
      :style="{ backgroundPosition: shift.x / 3 + 'px ' + shift.y / 3 + 'px' }"
    />

    <svg
      v-if="lively"
      class="blueprint__svg"
      :viewBox="'0 0 ' + BLUEPRINT_WIDTH + ' ' + BLUEPRINT_HEIGHT"
      preserveAspectRatio="xMidYMid slice"
    >
      <g
        class="blueprint__world"
        :style="{ transform: 'translate(' + shift.x + 'px, ' + shift.y + 'px)' }"
      >
        <g
          v-if="sketch !== null"
          :key="sketch.key"
          class="blueprint__sketch"
          :style="{ '--life': sketch.life + 'ms' }"
        >
          <template v-if="sketch.plan.guide !== null">
            <circle
              class="blueprint__guide"
              :cx="sketch.plan.guide.cx"
              :cy="sketch.plan.guide.cy"
              :r="sketch.plan.guide.r"
              pathLength="1"
            />
            <g
              class="blueprint__compass"
              :style="{
                transformOrigin: sketch.plan.guide.cx + 'px ' + sketch.plan.guide.cy + 'px',
              }"
            >
              <line
                class="blueprint__compass-leg"
                :x1="sketch.plan.guide.cx"
                :y1="sketch.plan.guide.cy"
                :x2="sketch.plan.guide.cx"
                :y2="sketch.plan.guide.cy - sketch.plan.guide.r"
              />
              <circle
                class="blueprint__compass-tip"
                :cx="sketch.plan.guide.cx"
                :cy="sketch.plan.guide.cy - sketch.plan.guide.r"
                r="4"
              />
            </g>
            <circle
              class="blueprint__center"
              :cx="sketch.plan.guide.cx"
              :cy="sketch.plan.guide.cy"
              r="3"
            />
          </template>

          <template v-if="sketch.plan.stroke === ''">
            <line
              v-for="(edge, index) in sketch.plan.edges"
              :key="'edge-' + index"
              class="blueprint__edge"
              :x1="edge.x1"
              :y1="edge.y1"
              :x2="edge.x2"
              :y2="edge.y2"
              pathLength="1"
              :style="{ '--delay': edge.delay + 'ms' }"
            />
          </template>
          <template v-else>
            <path
              class="blueprint__stroke"
              :d="sketch.plan.stroke"
              pathLength="1"
              :style="{ '--delay': strokeDelay(sketch.plan) + 'ms' }"
            />
            <circle class="blueprint__pen" r="6" :style="penStyle(sketch.plan)" />
          </template>

          <g
            v-for="(vertex, index) in sketch.plan.vertices"
            :key="'vertex-' + index"
            class="blueprint__node"
            :style="{ '--delay': vertex.delay + 'ms' }"
          >
            <path
              class="blueprint__tick"
              :d="
                'M ' +
                (vertex.x - 14) +
                ' ' +
                vertex.y +
                ' H ' +
                (vertex.x + 14) +
                ' M ' +
                vertex.x +
                ' ' +
                (vertex.y - 14) +
                ' V ' +
                (vertex.y + 14)
              "
            />
            <circle class="blueprint__vertex" :cx="vertex.x" :cy="vertex.y" r="9" />
            <text class="blueprint__label" :x="vertex.x + 13" :y="vertex.y - 12">
              {{ vertex.label }}
            </text>
          </g>

          <text
            class="blueprint__caption"
            :x="sketch.plan.captionX"
            :y="sketch.plan.captionY"
            text-anchor="middle"
          >
            {{ sketch.caption }}
          </text>
        </g>
      </g>
    </svg>

    <template v-if="lively && cross.visible">
      <div class="blueprint__cross blueprint__cross--x" :style="{ top: cross.y + 'px' }" />
      <div class="blueprint__cross blueprint__cross--y" :style="{ left: cross.x + 'px' }" />
      <div
        class="blueprint__snap"
        :style="{ transform: 'translate(' + cross.x + 'px, ' + cross.y + 'px)' }"
      >
        <span class="blueprint__coord">{{ coordLabel(cross.x, cross.y) }}</span>
      </div>
    </template>

    <table class="blueprint__stamp">
      <tbody>
        <tr v-for="row in stampRows" :key="row[0]">
          <th>{{ row[0] }}</th>
          <td :key="row[1]" class="blueprint__stamp-value">{{ row[1] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.blueprint {
  --bp-ink: color-mix(in srgb, var(--color-accent) 55%, var(--color-text-muted));
  --bp-minor: color-mix(in srgb, var(--color-accent) 7%, transparent);
  --bp-major: color-mix(in srgb, var(--color-accent) 15%, transparent);

  position: fixed;
  top: var(--header-height);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.blueprint__grid {
  position: absolute;
  inset: -40px;
  background-image:
    linear-gradient(to right, var(--bp-major) 1px, transparent 1px),
    linear-gradient(to bottom, var(--bp-major) 1px, transparent 1px),
    linear-gradient(to right, var(--bp-minor) 1px, transparent 1px),
    linear-gradient(to bottom, var(--bp-minor) 1px, transparent 1px);
  background-size:
    120px 120px,
    120px 120px,
    24px 24px,
    24px 24px;
  mask-image: radial-gradient(ellipse at 50% 45%, black 40%, rgb(0 0 0 / 35%) 100%);
  transition: background-position 900ms var(--ease-out);
}

.blueprint__svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.blueprint__world {
  transition: transform 900ms var(--ease-out);
}

.blueprint__sketch {
  animation: blueprint-life var(--life) linear forwards;
}

.blueprint__guide {
  fill: none;
  stroke: var(--bp-ink);
  stroke-width: 1;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0.45;
  animation: blueprint-draw 900ms var(--ease-out) forwards;
}

.blueprint__compass {
  opacity: 0;
  animation: blueprint-compass 900ms var(--ease-out) forwards;
}

.blueprint__compass-leg {
  stroke: var(--bp-ink);
  stroke-width: 1.4;
  stroke-dasharray: 6 5;
}

.blueprint__compass-tip {
  fill: var(--graph-active);
}

.blueprint__center {
  fill: var(--bp-ink);
  opacity: 0.6;
}

.blueprint__edge,
.blueprint__stroke {
  fill: none;
  stroke: var(--bp-ink);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0.7;
  animation: blueprint-draw 380ms var(--ease-out) var(--delay) forwards;
}

.blueprint__stroke {
  stroke: var(--graph-active);
  stroke-width: 2.6;
  animation-duration: 2400ms;
  animation-timing-function: linear;
}

.blueprint__pen {
  fill: var(--graph-active);
  offset-distance: 0%;
  opacity: 0;
  animation: blueprint-pen 2400ms linear var(--delay) forwards;
}

.blueprint__tick {
  stroke: var(--bp-ink);
  stroke-width: 1;
  opacity: 0;
  animation: blueprint-tick 900ms var(--ease-out) var(--delay) forwards;
}

.blueprint__vertex {
  fill: var(--color-surface);
  stroke: var(--bp-ink);
  stroke-width: 1.6;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: blueprint-vertex 420ms var(--ease-spring) var(--delay) forwards;
}

.blueprint__label {
  fill: var(--bp-ink);
  font-size: 13px;
  font-style: italic;
  opacity: 0;
  animation: blueprint-fade 500ms var(--ease-out) var(--delay) forwards;
}

.blueprint__caption {
  fill: var(--bp-ink);
  font-size: 16px;
  font-style: italic;
  opacity: 0;
  animation: blueprint-fade 700ms var(--ease-out) 600ms forwards;
}

.blueprint__cross {
  position: absolute;
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
}

.blueprint__cross--x {
  right: 0;
  left: 0;
  height: 1px;
  transition: top 120ms var(--ease-out);
}

.blueprint__cross--y {
  top: 0;
  bottom: 0;
  width: 1px;
  transition: left 120ms var(--ease-out);
}

.blueprint__snap {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--color-accent);
  transition: transform 120ms var(--ease-out);
}

.blueprint__coord {
  position: absolute;
  top: 12px;
  left: 12px;
  color: var(--bp-ink);
  font-size: 11px;
  font-style: italic;
  white-space: nowrap;
}

.blueprint__stamp {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-4);
  border: 1.5px solid var(--bp-ink);
  border-collapse: collapse;
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  color: var(--bp-ink);
  font-size: 11px;
  opacity: 0.75;
}

.blueprint__stamp th,
.blueprint__stamp td {
  max-width: 200px;
  padding: 3px var(--space-2);
  overflow: hidden;
  border: 1px solid var(--bp-major);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blueprint__stamp th {
  font-weight: 600;
}

.blueprint__stamp-value {
  font-style: italic;
  animation: blueprint-ink 700ms var(--ease-out);
}

@keyframes blueprint-life {
  0%,
  88% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes blueprint-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes blueprint-compass {
  0% {
    opacity: 0.9;
    transform: rotate(0deg);
  }
  90% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: rotate(360deg);
  }
}

@keyframes blueprint-pen {
  0% {
    opacity: 1;
    offset-distance: 0%;
  }
  95% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    offset-distance: 100%;
  }
}

@keyframes blueprint-tick {
  0% {
    opacity: 0;
  }
  30% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.2;
  }
}

@keyframes blueprint-vertex {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes blueprint-fade {
  to {
    opacity: 0.9;
  }
}

@keyframes blueprint-ink {
  from {
    color: var(--graph-active);
  }
}

@media (max-width: 900px) {
  .blueprint__stamp {
    display: none;
  }
}
</style>
