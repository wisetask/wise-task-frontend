<script setup lang="ts">
import { computed } from "vue";
import type { Graph } from "@/entities/graph";
import { PREVIEW_RADIUS, previewBox, previewEdges } from "../lib/graphPreview";

const props = withDefaults(
  defineProps<{
    graph: Graph | null;
    loading?: boolean;
    large?: boolean;
  }>(),
  {
    loading: false,
    large: false,
  },
);

const viewBox = computed(() => {
  if (props.graph === null) {
    return "0 0 1 1";
  }
  const box = previewBox(props.graph);
  return box.x + " " + box.y + " " + box.width + " " + box.height;
});

const edges = computed(() => (props.graph === null ? [] : previewEdges(props.graph)));

function itemStyle(index: number): Record<string, string> {
  return { "--mini-index": String(Math.min(index, 14)) };
}
</script>

<template>
  <span
    class="graph-mini"
    :class="{
      'graph-mini--large': large,
      'graph-mini--loading': loading,
      'graph-mini--empty': !loading && graph === null,
    }"
    aria-hidden="true"
  >
    <svg v-if="graph !== null" class="graph-mini__svg" :viewBox="viewBox">
      <g v-for="(edge, index) in edges" :key="edge.id">
        <path class="graph-mini__line" :d="edge.path" pathLength="1" :style="itemStyle(index)" />
        <text
          v-if="large && edge.text !== ''"
          class="graph-mini__weight"
          :x="edge.textX"
          :y="edge.textY + 5"
          text-anchor="middle"
        >
          {{ edge.text }}
        </text>
      </g>
      <g v-for="(vertex, index) in graph.vertices" :key="vertex.id">
        <circle
          class="graph-mini__vertex"
          :class="'graph-mini__vertex--' + vertex.color.toLowerCase()"
          :cx="vertex.x"
          :cy="vertex.y"
          :r="PREVIEW_RADIUS"
          :style="itemStyle(index)"
        />
        <text
          v-if="large"
          class="graph-mini__label"
          :x="vertex.x"
          :y="vertex.y + 5"
          text-anchor="middle"
        >
          {{ vertex.label }}
        </text>
      </g>
    </svg>
  </span>
</template>

<style scoped>
.graph-mini {
  display: block;
  width: 96px;
  height: 64px;
  border-radius: var(--radius-md);
}

.graph-mini--large {
  width: 100%;
  height: 190px;
}

.graph-mini--loading {
  background: linear-gradient(
    90deg,
    var(--color-surface-hover) 25%,
    var(--color-border) 50%,
    var(--color-surface-hover) 75%
  );
  background-size: 200% 100%;
  opacity: 0.6;
  animation: graph-mini-shimmer 1.2s linear infinite;
}

.graph-mini--empty {
  display: none;
}

.graph-mini__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  font-family: var(--font-family);
  animation: graph-mini-in 360ms var(--ease-out) backwards;
}

.graph-mini__line {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 1.6;
  stroke-dasharray: 1;
  vector-effect: non-scaling-stroke;
}

.graph-mini--large .graph-mini__line {
  stroke-width: 2;
  animation: graph-mini-draw 600ms var(--ease-out) calc(var(--mini-index) * 35ms) backwards;
}

.graph-mini__vertex {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center;
}

.graph-mini--large .graph-mini__vertex {
  stroke-width: 2;
  animation: graph-mini-pop 420ms var(--ease-spring) calc(var(--mini-index) * 35ms + 150ms)
    backwards;
}

.graph-mini__vertex--red {
  fill: var(--graph-red-fill);
  stroke: var(--graph-red-stroke);
}

.graph-mini__vertex--green {
  fill: var(--graph-green-fill);
  stroke: var(--graph-green-stroke);
}

.graph-mini__vertex--blue {
  fill: var(--graph-blue-fill);
  stroke: var(--graph-blue-stroke);
}

.graph-mini__label {
  fill: var(--graph-vertex-text);
  font-size: 15px;
  font-weight: 700;
}

.graph-mini__weight {
  fill: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  paint-order: stroke;
  stroke: var(--color-surface);
  stroke-width: 5px;
  stroke-linejoin: round;
}

@keyframes graph-mini-shimmer {
  to {
    background-position: -200% 0;
  }
}

@keyframes graph-mini-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}

@keyframes graph-mini-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes graph-mini-pop {
  from {
    transform: scale(0);
  }
}
</style>
