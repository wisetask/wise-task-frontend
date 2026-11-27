<script setup lang="ts">
import { computed } from "vue";
import type { Graph } from "@/entities/graph";
import { PREVIEW_RADIUS, previewBox } from "@/widgets/task-view";
import type { DiffVertex, GraphDiff } from "../model/graphDiff";

const props = defineProps<{
  diff: GraphDiff;
}>();

const viewBox = computed(() => {
  const graph: Graph = { name: "", isDirected: props.diff.isDirected, vertices: [], edges: [] };
  for (const vertex of props.diff.vertices) {
    graph.vertices.push({
      id: vertex.key,
      label: vertex.label,
      x: vertex.x,
      y: vertex.y,
      color: vertex.color,
      weight: 0,
    });
  }
  const box = previewBox(graph);
  return box.x + " " + box.y + " " + box.width + " " + box.height;
});

function vertexClass(vertex: DiffVertex): string[] {
  return ["diff__vertex--" + vertex.state, "diff__vertex--" + vertex.color.toLowerCase()];
}

function itemDelay(index: number): Record<string, string> {
  return { animationDelay: 150 + Math.min(index * 40, 800) + "ms" };
}
</script>

<template>
  <div class="diff">
    <svg
      class="diff__svg"
      :viewBox="viewBox"
      role="img"
      aria-label="Чем ответ отличается от графа задачи"
    >
      <line
        v-for="(edge, index) in diff.edges"
        :key="edge.key"
        class="diff__edge"
        :class="'diff__edge--' + edge.state"
        :x1="edge.x1"
        :y1="edge.y1"
        :x2="edge.x2"
        :y2="edge.y2"
        :style="itemDelay(index)"
      />
      <g
        v-for="(vertex, index) in diff.vertices"
        :key="vertex.key"
        class="diff__vertex"
        :class="vertexClass(vertex)"
        :style="itemDelay(index)"
      >
        <circle
          v-if="vertex.state !== 'same'"
          class="diff__halo"
          :cx="vertex.x"
          :cy="vertex.y"
          :r="PREVIEW_RADIUS + 7"
        />
        <circle class="diff__circle" :cx="vertex.x" :cy="vertex.y" :r="PREVIEW_RADIUS" />
        <text class="diff__label" :x="vertex.x" :y="vertex.y + 5" text-anchor="middle">
          {{ vertex.label }}
        </text>
      </g>
    </svg>
    <ul class="diff__legend" aria-hidden="true">
      <li class="diff__key diff__key--added">добавлено</li>
      <li class="diff__key diff__key--removed">удалено</li>
      <li class="diff__key diff__key--recolored">перекрашено</li>
    </ul>
  </div>
</template>

<style scoped>
.diff {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--graph-canvas-bg);
  background-image: radial-gradient(
    color-mix(in srgb, var(--color-text-muted) 26%, transparent) 1px,
    transparent 1.5px
  );
  background-size: 22px 22px;
}

.diff__svg {
  display: block;
  width: 100%;
  height: 100%;
  font-family: var(--font-family);
}

.diff__edge {
  stroke: var(--graph-edge);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.diff__edge--added {
  stroke: var(--color-success);
  stroke-width: 4;
  filter: drop-shadow(0 0 4px var(--color-success));
  animation: diff-grow 600ms var(--ease-out) backwards;
}

.diff__edge--removed {
  stroke: var(--color-danger);
  stroke-width: 3;
  stroke-dasharray: 8 7;
  opacity: 0.75;
  animation:
    diff-fade-in 500ms var(--ease-out) backwards,
    diff-march 1s linear infinite;
}

.diff__vertex {
  transform-box: fill-box;
  transform-origin: center;
  animation: diff-pop 460ms var(--ease-spring) backwards;
}

.diff__circle {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
}

.diff__vertex--red .diff__circle {
  fill: var(--graph-red-fill);
  stroke: var(--graph-red-stroke);
}

.diff__vertex--green .diff__circle {
  fill: var(--graph-green-fill);
  stroke: var(--graph-green-stroke);
}

.diff__vertex--blue .diff__circle {
  fill: var(--graph-blue-fill);
  stroke: var(--graph-blue-stroke);
}

.diff__label {
  fill: var(--graph-vertex-text);
  font-size: 14px;
  font-weight: 700;
}

.diff__halo {
  fill: none;
  stroke-width: 3;
  transform-box: fill-box;
  transform-origin: center;
  animation: diff-halo 1.8s var(--ease-out) 600ms infinite;
}

.diff__vertex--added .diff__halo {
  stroke: var(--color-success);
}

.diff__vertex--recolored .diff__halo {
  stroke: var(--graph-active);
}

.diff__vertex--removed .diff__halo {
  stroke: var(--color-danger);
  stroke-dasharray: 5 4;
  animation: none;
}

.diff__vertex--removed .diff__circle {
  fill: transparent;
  stroke: var(--color-danger);
  stroke-dasharray: 5 4;
}

.diff__vertex--removed {
  opacity: 0.7;
}

.diff__legend {
  position: absolute;
  top: 68px;
  left: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.diff__key {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  font-size: 12px;
  animation: diff-fade-in 400ms var(--ease-out) backwards;
}

.diff__key::before {
  content: "";
  width: 14px;
  height: 0;
  border-top: 3px solid currentColor;
}

.diff__key--added {
  color: var(--color-success);
}

.diff__key--removed {
  color: var(--color-danger);
  animation-delay: 80ms;
}

.diff__key--removed::before {
  border-top-style: dashed;
}

.diff__key--recolored {
  color: var(--graph-active);
  animation-delay: 160ms;
}

.diff__key--recolored::before {
  width: 10px;
  height: 10px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

@keyframes diff-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}

@keyframes diff-grow {
  from {
    opacity: 0;
  }
}

@keyframes diff-fade-in {
  from {
    opacity: 0;
  }
}

@keyframes diff-march {
  to {
    stroke-dashoffset: -30;
  }
}

@keyframes diff-halo {
  from {
    opacity: 0.9;
    transform: scale(0.85);
  }
  to {
    opacity: 0;
    transform: scale(1.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .diff__edge--removed,
  .diff__halo {
    animation: none !important;
  }
}
</style>
