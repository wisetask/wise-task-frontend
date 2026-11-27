<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import { colorClass, edgeArrow } from "../lib/colors";
import type { EdgeShape } from "../lib/geometry";

const props = defineProps<{
  shape: EdgeShape;
  selected: boolean;
  directed: boolean;
  title?: string;
  lit?: boolean;
  appearDelay?: number;
  algoState?: string;
  component?: number | null;
}>();

const emit = defineEmits<{
  pick: [event: MouseEvent];
  menu: [event: MouseEvent];
  rename: [];
}>();

const hovered = ref(false);
const paintKey = ref(0);

watch(
  () => props.shape.color,
  () => {
    paintKey.value = paintKey.value + 1;
  },
);

const appearStyle = computed(() => {
  if (props.appearDelay === undefined || props.appearDelay === 0) {
    return undefined;
  }
  return { animationDelay: props.appearDelay + "ms" };
});

const showFlow = computed(() => props.directed && hovered.value && motionAllowed());

const arrow = computed(() => {
  if (!props.directed) {
    return undefined;
  }
  return edgeArrow(props.shape.color, props.selected);
});
</script>

<template>
  <g
    class="graph-edge"
    :class="[
      'graph-edge--' + colorClass(shape.color),
      {
        'graph-edge--selected': selected,
        'graph-edge--lit': lit,
        'graph-edge--algo-tree': algoState === 'tree',
        'graph-edge--algo-active': algoState === 'active',
      },
      component === null || component === undefined ? '' : 'graph-edge--part-' + (component % 6),
    ]"
    @click.stop="emit('pick', $event)"
    @contextmenu.prevent="emit('menu', $event)"
    @dblclick.stop="emit('rename')"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
  >
    <title v-if="title">{{ title }}</title>
    <path :d="shape.path" class="graph-edge__hit" />
    <path
      :d="shape.path"
      class="graph-edge__line"
      pathLength="1"
      :marker-end="arrow"
      :style="appearStyle"
    />
    <path
      v-if="paintKey > 0"
      :key="'paint-' + paintKey"
      :d="shape.path"
      class="graph-edge__paint"
    />
    <circle v-if="showFlow" r="3.5" class="graph-edge__flow">
      <animateMotion :path="shape.path" dur="0.9s" repeatCount="indefinite" />
    </circle>
    <text
      v-if="shape.text !== ''"
      :x="shape.labelX"
      :y="shape.labelY + 4"
      text-anchor="middle"
      class="graph-edge__text"
    >
      {{ shape.text }}
    </text>
  </g>
</template>

<style scoped>
.graph-edge {
  cursor: pointer;
}

.graph-edge__hit {
  fill: none;
  stroke: transparent;
  stroke-width: 14;
  pointer-events: stroke;
}

.graph-edge__line {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 2;
  stroke-dasharray: 1;
  pointer-events: none;
  transition:
    stroke var(--duration-fast) var(--ease-out),
    stroke-width var(--duration-fast) var(--ease-out);
  animation: graph-edge-draw 450ms var(--ease-out) both;
}

.graph-edge--red .graph-edge__line {
  stroke: var(--graph-red-stroke);
}

.graph-edge--green .graph-edge__line {
  stroke: var(--graph-green-stroke);
}

.graph-edge--blue .graph-edge__line {
  stroke: var(--graph-blue-stroke);
}

.graph-edge:hover .graph-edge__line {
  stroke-width: 3;
}

.graph-edge__paint {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0;
  pointer-events: none;
  animation: graph-edge-paint 650ms var(--ease-out);
}

.graph-edge--red .graph-edge__paint {
  stroke: var(--graph-red-stroke);
}

.graph-edge--green .graph-edge__paint {
  stroke: var(--graph-green-stroke);
}

.graph-edge--blue .graph-edge__paint {
  stroke: var(--graph-blue-stroke);
}

@keyframes graph-edge-paint {
  from {
    opacity: 0.6;
    stroke-width: 14;
  }
  to {
    opacity: 0;
    stroke-width: 2;
  }
}

.graph-edge__flow {
  fill: var(--color-accent);
  filter: drop-shadow(0 0 3px var(--color-accent));
  pointer-events: none;
}

.graph-edge--lit .graph-edge__line {
  stroke: var(--color-accent);
  stroke-width: 2.5;
}

.graph-edge--part-0 .graph-edge__line {
  stroke: #7c5cff;
}

.graph-edge--part-1 .graph-edge__line {
  stroke: #00b3a4;
}

.graph-edge--part-2 .graph-edge__line {
  stroke: #ff8a3d;
}

.graph-edge--part-3 .graph-edge__line {
  stroke: #e84393;
}

.graph-edge--part-4 .graph-edge__line {
  stroke: #3fa9f5;
}

.graph-edge--part-5 .graph-edge__line {
  stroke: #9bc53d;
}

.graph-edge--algo-tree .graph-edge__line {
  stroke: var(--color-accent);
  stroke-width: 3.5;
}

.graph-edge--algo-active .graph-edge__line {
  stroke: var(--graph-active);
  stroke-width: 4;
  filter: drop-shadow(0 0 4px var(--graph-active));
}

.graph-edge--selected .graph-edge__line {
  stroke: var(--color-accent);
  stroke-width: 3;
}

@keyframes graph-edge-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-edge__line {
    animation: none;
  }
}

.graph-edge__text {
  fill: var(--graph-vertex-text);
  font-size: 13px;
  paint-order: stroke;
  stroke: var(--graph-canvas-bg);
  stroke-width: 4;
  pointer-events: none;
}
</style>
