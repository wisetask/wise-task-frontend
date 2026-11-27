<script setup lang="ts">
import { computed, ref } from "vue";
import { attemptsText, type TaskGroup } from "../model/solutionList";
import { taskMapLayout, type MapNode } from "../model/sideViews";

const MAP_WIDTH = 210;
const MAP_HEIGHT = 170;

const props = withDefaults(
  defineProps<{
    groups: TaskGroup[];
    activeKey?: string;
    activeCategory?: string;
  }>(),
  {
    activeKey: "",
    activeCategory: "",
  },
);

const emit = defineEmits<{
  pick: [key: string];
}>();

const hovered = ref("");

const layout = computed(() => taskMapLayout(props.groups, MAP_WIDTH, MAP_HEIGHT));

const focusKey = computed(() => (hovered.value !== "" ? hovered.value : props.activeKey));

const focusNode = computed(() => {
  for (const node of layout.value.nodes) {
    if (node.key === focusKey.value) {
      return node;
    }
  }
  return null;
});

const caption = computed(() => {
  const node = focusNode.value;
  if (node === null) {
    return "Каждая вершина — задача, которую вы пробовали. Нажмите, чтобы найти её в списке.";
  }
  return node.taskName + " · " + attemptsText(node.attempts) + (node.solved ? " · решена" : "");
});

function nodeClass(node: MapNode): Record<string, boolean> {
  const result: Record<string, boolean> = {
    "map__node--solved": node.solved,
    "map__node--open": !node.solved,
    "map__node--active": node.key === focusKey.value,
    "map__node--dim": props.activeCategory !== "" && node.category !== props.activeCategory,
  };
  result["map__node--drift-" + node.drift] = true;
  return result;
}

function nodeStyle(node: MapNode, index: number): Record<string, string> {
  return {
    "--drift-delay": node.delay,
    "--drift-time": node.duration,
    "--pop-delay": 200 + Math.min(index * 35, 900) + "ms",
  };
}

function edgeStyle(index: number): Record<string, string> {
  return { animationDelay: 400 + Math.min(index * 40, 800) + "ms" };
}

function edgeDim(edge: number[]): boolean {
  if (props.activeCategory === "") {
    return false;
  }
  return layout.value.nodes[edge[0]].category !== props.activeCategory;
}
</script>

<template>
  <div class="map">
    <svg
      class="map__svg"
      :viewBox="'0 0 ' + MAP_WIDTH + ' ' + MAP_HEIGHT"
      aria-hidden="true"
      @pointerleave="hovered = ''"
    >
      <line
        v-for="(edge, index) in layout.edges"
        :key="'edge-' + index"
        class="map__edge"
        :class="{ 'map__edge--dim': edgeDim(edge) }"
        :x1="layout.nodes[edge[0]].x"
        :y1="layout.nodes[edge[0]].y"
        :x2="layout.nodes[edge[1]].x"
        :y2="layout.nodes[edge[1]].y"
        pathLength="1"
        :style="edgeStyle(index)"
      />
      <g
        v-for="(node, index) in layout.nodes"
        :key="node.key"
        class="map__node"
        :class="nodeClass(node)"
        :style="nodeStyle(node, index)"
        @pointerenter="hovered = node.key"
        @click="emit('pick', node.key)"
      >
        <g class="map__float">
          <circle class="map__halo" :cx="node.x" :cy="node.y" :r="node.r + 5" />
          <circle class="map__dot" :cx="node.x" :cy="node.y" :r="node.r" />
        </g>
      </g>
    </svg>
    <p class="map__caption" :class="{ 'map__caption--active': focusNode !== null }">
      {{ caption }}
    </p>
  </div>
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.map__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  border-radius: var(--radius-md);
  background:
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--color-accent) 10%, transparent),
      transparent 70%
    ),
    var(--graph-canvas-bg);
}

.map__edge {
  stroke: var(--graph-edge);
  stroke-width: 1;
  stroke-dasharray: 1;
  opacity: 0.7;
  animation: map-draw 700ms var(--ease-out) backwards;
  transition: opacity var(--duration) var(--ease-out);
}

.map__edge--dim {
  opacity: 0.12;
}

.map__node {
  cursor: pointer;
  transition: opacity var(--duration) var(--ease-out);
}

.map__node--dim {
  opacity: 0.2;
}

.map__float {
  animation: map-drift-0 var(--drift-time) ease-in-out var(--drift-delay) infinite alternate;
}

.map__node--drift-1 .map__float {
  animation-name: map-drift-1;
}

.map__node--drift-2 .map__float {
  animation-name: map-drift-2;
}

.map__dot {
  stroke-width: 1.6;
  transform-box: fill-box;
  transform-origin: center;
  animation: map-pop 460ms var(--ease-spring) var(--pop-delay) backwards;
  transition: transform var(--duration) var(--ease-spring);
}

.map__node--solved .map__dot {
  fill: var(--graph-green-fill);
  stroke: var(--color-success);
}

.map__node--open .map__dot {
  fill: var(--graph-red-fill);
  stroke: var(--graph-active);
}

.map__halo {
  fill: none;
  stroke-width: 1.5;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
}

.map__node--solved .map__halo {
  stroke: var(--color-success);
  animation: map-glow 3.6s ease-in-out var(--drift-delay) infinite;
}

.map__node--open .map__halo {
  stroke: var(--graph-active);
}

.map__node:hover .map__dot,
.map__node--active .map__dot {
  transform: scale(1.45);
}

.map__node--active .map__halo {
  stroke: var(--color-accent);
  animation: map-ping 1.4s var(--ease-out) infinite;
}

.map__caption {
  min-height: 3em;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.45;
  transition: color var(--duration) var(--ease-out);
}

.map__caption--active {
  color: var(--color-text);
}

@keyframes map-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes map-pop {
  from {
    opacity: 0;
    transform: scale(0);
  }
}

@keyframes map-drift-0 {
  to {
    transform: translate(3px, -4px);
  }
}

@keyframes map-drift-1 {
  to {
    transform: translate(-4px, 2px);
  }
}

@keyframes map-drift-2 {
  to {
    transform: translate(2px, 4px);
  }
}

@keyframes map-glow {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.7;
    transform: scale(1);
  }
}

@keyframes map-ping {
  from {
    opacity: 0.9;
    transform: scale(0.8);
  }
  to {
    opacity: 0;
    transform: scale(1.7);
  }
}

@media (prefers-reduced-motion: reduce) {
  .map__float,
  .map__halo {
    animation: none !important;
  }
}
</style>
