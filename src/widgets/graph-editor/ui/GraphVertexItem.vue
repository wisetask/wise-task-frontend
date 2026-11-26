<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Vertex } from "@/entities/graph";
import { colorClass } from "../lib/colors";
import { VERTEX_RADIUS } from "../lib/geometry";

const BADGE_SHIFT = VERTEX_RADIUS * 0.8;

const props = defineProps<{
  vertex: Vertex;
  selected: boolean;
  highlighted: boolean;
  dragged: boolean;
  draggable: boolean;
  degree?: number | null;
  waveStep?: number | null;
  waveKey?: number;
  lit?: boolean;
  snapped?: boolean;
  glow?: boolean;
  appearDelay?: number;
  algoState?: string;
  algoLabel?: string;
  labelOverride?: string;
}>();

const paintKey = ref(0);

watch(
  () => props.vertex.color,
  () => {
    paintKey.value = paintKey.value + 1;
  },
);

const shownLabel = computed(() => {
  if (props.labelOverride !== undefined && props.labelOverride !== "") {
    return props.labelOverride;
  }
  return props.vertex.label;
});

const algoLabelWidth = computed(() => {
  if (props.algoLabel === undefined) {
    return 0;
  }
  return 14 + props.algoLabel.length * 7;
});

const appearStyle = computed(() => {
  if (props.appearDelay === undefined || props.appearDelay === 0) {
    return undefined;
  }
  return { animationDelay: props.appearDelay + "ms" };
});

const waving = computed(() => props.waveStep !== null && props.waveStep !== undefined);

const waveStyle = computed(() => {
  if (props.waveStep === null || props.waveStep === undefined) {
    return {};
  }
  return { animationDelay: props.waveStep * 90 + "ms" };
});

const emit = defineEmits<{
  grab: [event: PointerEvent];
  pick: [event: MouseEvent];
  menu: [event: MouseEvent];
  rename: [];
}>();
</script>

<template>
  <g
    class="graph-vertex"
    :class="[
      'graph-vertex--' + colorClass(vertex.color),
      {
        'graph-vertex--selected': selected || highlighted,
        'graph-vertex--draggable': draggable,
        'graph-vertex--dragged': dragged,
        'graph-vertex--snapped': snapped,
        ['graph-vertex--algo-' + algoState]: algoState !== undefined && algoState !== '',
      },
    ]"
    :style="appearStyle"
    @pointerdown="emit('grab', $event)"
    @click.stop="emit('pick', $event)"
    @contextmenu.prevent="emit('menu', $event)"
    @dblclick.stop="emit('rename')"
  >
    <circle
      v-if="paintKey > 0"
      :key="'paint-' + paintKey"
      :cx="vertex.x"
      :cy="vertex.y"
      :r="VERTEX_RADIUS"
      class="graph-vertex__paint"
    />
    <circle
      v-if="glow"
      :cx="vertex.x"
      :cy="vertex.y"
      :r="VERTEX_RADIUS + 16"
      class="graph-vertex__island"
    />
    <circle
      v-if="selected || lit || snapped"
      :cx="vertex.x"
      :cy="vertex.y"
      :r="VERTEX_RADIUS + 6"
      class="graph-vertex__halo"
      :class="{ 'graph-vertex__halo--selected': selected }"
    />
    <circle
      v-if="selected"
      :cx="vertex.x"
      :cy="vertex.y"
      :r="VERTEX_RADIUS"
      class="graph-vertex__ring"
    />
    <circle
      v-if="algoState === 'current'"
      :cx="vertex.x"
      :cy="vertex.y"
      :r="VERTEX_RADIUS + 8"
      class="graph-vertex__algo-ring"
    />
    <g
      :key="'body-' + waveKey"
      class="graph-vertex__body"
      :class="{ 'graph-vertex__body--wave': waving }"
      :style="waveStyle"
    >
      <circle :cx="vertex.x" :cy="vertex.y" :r="VERTEX_RADIUS" :style="waveStyle" />
      <text :x="vertex.x" :y="vertex.y + 5" text-anchor="middle" class="graph-vertex__label">
        {{ shownLabel }}
      </text>
    </g>
    <g
      v-if="algoLabel !== undefined && algoLabel !== ''"
      :key="'algo-' + algoLabel"
      class="graph-vertex__algo-label"
    >
      <rect
        :x="vertex.x - algoLabelWidth / 2"
        :y="vertex.y - VERTEX_RADIUS - 26"
        :width="algoLabelWidth"
        height="18"
        rx="9"
      />
      <text :x="vertex.x" :y="vertex.y - VERTEX_RADIUS - 13" text-anchor="middle">
        {{ algoLabel }}
      </text>
    </g>
    <g v-if="degree !== null && degree !== undefined" class="graph-vertex__degree">
      <circle
        :cx="vertex.x + BADGE_SHIFT"
        :cy="vertex.y + BADGE_SHIFT"
        r="9"
        class="graph-vertex__degree-dot"
      />
      <text
        :x="vertex.x + BADGE_SHIFT"
        :y="vertex.y + BADGE_SHIFT + 4"
        text-anchor="middle"
        class="graph-vertex__degree-text"
      >
        {{ degree }}
      </text>
    </g>
    <text
      v-if="vertex.weight !== 0"
      :x="vertex.x + VERTEX_RADIUS + 4"
      :y="vertex.y - VERTEX_RADIUS + 6"
      class="graph-vertex__weight"
    >
      {{ vertex.weight }}
    </text>
  </g>
</template>

<style scoped>
.graph-vertex {
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-vertex-pop 650ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.graph-vertex .graph-vertex__halo {
  fill: var(--color-accent);
  fill-opacity: 0.12;
  stroke: none;
  pointer-events: none;
}

.graph-vertex .graph-vertex__halo--selected {
  fill-opacity: 0.2;
}

.graph-vertex .graph-vertex__ring {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-vertex-ring 600ms var(--ease-out) both;
}

.graph-vertex:hover .graph-vertex__body circle {
  stroke-width: 3;
}

@keyframes graph-vertex-pop {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  45% {
    opacity: 1;
  }
  70% {
    transform: scale(1.03);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}

@keyframes graph-vertex-ring {
  from {
    opacity: 0.7;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.9);
  }
}

.graph-vertex--draggable {
  cursor: grab;
}

.graph-vertex--dragged {
  cursor: grabbing;
}

.graph-vertex circle {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
}

.graph-vertex--red circle {
  fill: var(--graph-red-fill);
  stroke: var(--graph-red-stroke);
}

.graph-vertex--green circle {
  fill: var(--graph-green-fill);
  stroke: var(--graph-green-stroke);
}

.graph-vertex--blue circle {
  fill: var(--graph-blue-fill);
  stroke: var(--graph-blue-stroke);
}

.graph-vertex--selected circle {
  stroke: var(--color-accent);
  stroke-width: 3;
}

.graph-vertex__body {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 180ms var(--ease-out);
}

.graph-vertex .graph-vertex__body circle {
  transition:
    fill var(--duration) var(--ease-out),
    stroke var(--duration) var(--ease-out);
}

.graph-vertex--algo-visited .graph-vertex__body circle {
  fill: var(--color-accent-muted);
  stroke: var(--color-accent);
  stroke-width: 3;
}

.graph-vertex--algo-frontier .graph-vertex__body circle {
  stroke: var(--graph-active);
  stroke-width: 3;
  stroke-dasharray: 5 4;
  animation: graph-vertex-march 1s linear infinite;
}

.graph-vertex--algo-current .graph-vertex__body circle {
  fill: var(--graph-active);
  stroke: var(--graph-active);
  stroke-width: 3;
}

.graph-vertex--algo-current .graph-vertex__label {
  fill: #ffffff;
  font-weight: 700;
}

.graph-vertex .graph-vertex__algo-ring {
  fill: none;
  stroke: var(--graph-active);
  stroke-width: 2;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-vertex-algo-ring 1.2s var(--ease-out) infinite;
}

.graph-vertex__algo-label {
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: graph-degree-in var(--duration) var(--ease-spring) both;
}

.graph-vertex .graph-vertex__algo-label rect {
  fill: var(--color-surface);
  stroke: var(--graph-active);
  stroke-width: 1.5;
}

.graph-vertex__algo-label text {
  fill: var(--color-text);
  font-size: 11px;
  font-weight: 700;
}

@keyframes graph-vertex-march {
  to {
    stroke-dashoffset: -18;
  }
}

@keyframes graph-vertex-algo-ring {
  from {
    opacity: 0.8;
    transform: scale(0.85);
  }
  to {
    opacity: 0;
    transform: scale(1.35);
  }
}

.graph-vertex--snapped .graph-vertex__body {
  transform: scale(1.18);
}

.graph-vertex .graph-vertex__paint {
  fill: var(--graph-vertex-stroke);
  stroke: none;
  opacity: 0;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-vertex-paint 650ms var(--ease-out);
}

.graph-vertex--red .graph-vertex__paint {
  fill: var(--graph-red-stroke);
}

.graph-vertex--green .graph-vertex__paint {
  fill: var(--graph-green-stroke);
}

.graph-vertex--blue .graph-vertex__paint {
  fill: var(--graph-blue-stroke);
}

@keyframes graph-vertex-paint {
  from {
    opacity: 0.55;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(2.4);
  }
}

.graph-vertex .graph-vertex__island {
  fill: var(--color-success);
  fill-opacity: 0.18;
  stroke: var(--color-success);
  stroke-width: 2;
  stroke-dasharray: 6 5;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-vertex-island 1.4s ease-in-out infinite;
}

@keyframes graph-vertex-island {
  0%,
  100% {
    transform: scale(0.92);
  }
  50% {
    transform: scale(1.08);
  }
}

.graph-vertex__body--wave {
  animation: graph-vertex-jump 700ms var(--ease-out) backwards;
}

.graph-vertex__body--wave circle {
  animation: graph-vertex-flash 700ms var(--ease-out) backwards;
}

@keyframes graph-vertex-jump {
  0% {
    transform: none;
  }
  30% {
    transform: translateY(-16px) scale(1.15);
  }
  55% {
    transform: translateY(0) scale(0.92, 1.05);
  }
  75% {
    transform: translateY(-4px) scale(1.02);
  }
  100% {
    transform: none;
  }
}

@keyframes graph-vertex-flash {
  30% {
    stroke: var(--color-accent);
    stroke-width: 4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-vertex,
  .graph-vertex .graph-vertex__ring,
  .graph-vertex .graph-vertex__algo-ring,
  .graph-vertex--algo-frontier .graph-vertex__body circle,
  .graph-vertex__algo-label,
  .graph-vertex .graph-vertex__island,
  .graph-vertex__body--wave,
  .graph-vertex__body--wave circle,
  .graph-vertex__degree {
    animation: none;
  }
}

.graph-vertex__label {
  fill: var(--graph-vertex-text);
  font-size: 14px;
  pointer-events: none;
}

.graph-vertex__weight {
  fill: var(--color-text-muted);
  font-size: 12px;
  pointer-events: none;
}

.graph-vertex__degree {
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-degree-in var(--duration) var(--ease-spring) both;
}

.graph-vertex .graph-vertex__degree-dot {
  fill: var(--color-accent);
  stroke: var(--graph-canvas-bg);
  stroke-width: 2;
}

.graph-vertex__degree-text {
  fill: var(--color-on-accent);
  font-size: 11px;
  font-weight: 700;
}

@keyframes graph-degree-in {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
