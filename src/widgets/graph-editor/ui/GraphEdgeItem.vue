<script setup lang="ts">
import { computed } from "vue";
import { colorClass, edgeArrow } from "../lib/colors";
import type { EdgeShape } from "../lib/geometry";

const props = defineProps<{
  shape: EdgeShape;
  selected: boolean;
  directed: boolean;
}>();

const emit = defineEmits<{
  pick: [event: MouseEvent];
  menu: [event: MouseEvent];
}>();

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
    :class="['graph-edge--' + colorClass(shape.color), { 'graph-edge--selected': selected }]"
    @click.stop="emit('pick', $event)"
    @contextmenu.prevent="emit('menu', $event)"
  >
    <path :d="shape.path" class="graph-edge__hit" />
    <path :d="shape.path" class="graph-edge__line" :marker-end="arrow" />
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
  pointer-events: none;
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

.graph-edge--selected .graph-edge__line {
  stroke: var(--color-accent);
  stroke-width: 3;
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
