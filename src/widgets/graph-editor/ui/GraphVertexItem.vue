<script setup lang="ts">
import type { Vertex } from "@/entities/graph";
import { colorClass } from "../lib/colors";
import { VERTEX_RADIUS } from "../lib/geometry";

defineProps<{
  vertex: Vertex;
  selected: boolean;
  highlighted: boolean;
  dragged: boolean;
  draggable: boolean;
}>();

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
      },
    ]"
    @pointerdown="emit('grab', $event)"
    @click.stop="emit('pick', $event)"
    @contextmenu.prevent="emit('menu', $event)"
    @dblclick.stop="emit('rename')"
  >
    <circle :cx="vertex.x" :cy="vertex.y" :r="VERTEX_RADIUS" />
    <text :x="vertex.x" :y="vertex.y + 5" text-anchor="middle" class="graph-vertex__label">
      {{ vertex.label }}
    </text>
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
</style>
