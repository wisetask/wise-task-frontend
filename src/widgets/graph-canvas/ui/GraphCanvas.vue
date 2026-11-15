<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  addEdge,
  addVertex,
  findVertex,
  moveVertex,
  removeEdge,
  removeVertex,
  type Graph,
  type Vertex,
} from "@/entities/graph";
import { buildEdgeShapes, VERTEX_RADIUS, type Point } from "../lib/geometry";

const props = defineProps<{
  graph: Graph;
}>();

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "before-change": [graph: Graph];
}>();

const DRAG_THRESHOLD = 3;

const svgElement = ref<SVGSVGElement | null>(null);
const selectedVertexId = ref<string | null>(null);
const cursorPoint = ref<Point | null>(null);
const draggedVertexId = ref<string | null>(null);

let pressPoint: Point = { x: 0, y: 0 };
let grabOffset: Point = { x: 0, y: 0 };
let hasMoved = false;
let skipNextClick = false;

const edgeShapes = computed(() => buildEdgeShapes(props.graph, VERTEX_RADIUS));

const selectedVertex = computed(() => {
  if (selectedVertexId.value === null) {
    return undefined;
  }
  return findVertex(props.graph, selectedVertexId.value);
});

function toCanvasPoint(event: MouseEvent): Point {
  if (svgElement.value === null) {
    return { x: event.offsetX, y: event.offsetY };
  }
  const box = svgElement.value.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function keepInside(x: number, y: number): Point {
  if (svgElement.value === null) {
    return { x: x, y: y };
  }
  const box = svgElement.value.getBoundingClientRect();
  return {
    x: clamp(x, VERTEX_RADIUS, box.width - VERTEX_RADIUS),
    y: clamp(y, VERTEX_RADIUS, box.height - VERTEX_RADIUS),
  };
}

function applyChange(newGraph: Graph) {
  if (newGraph === props.graph) {
    return;
  }
  emit("before-change", props.graph);
  emit("update:graph", newGraph);
}

function clearSelection() {
  selectedVertexId.value = null;
  cursorPoint.value = null;
}

function onCanvasClick(event: MouseEvent) {
  if (skipNextClick) {
    skipNextClick = false;
    return;
  }
  const point = toCanvasPoint(event);
  applyChange(addVertex(props.graph, point.x, point.y));
  clearSelection();
}

function onCanvasPointerMove(event: PointerEvent) {
  if (selectedVertexId.value !== null) {
    cursorPoint.value = toCanvasPoint(event);
  }
}

function onCanvasPointerLeave() {
  cursorPoint.value = null;
}

function onVertexPointerDown(event: PointerEvent, vertex: Vertex) {
  if (event.button !== 0) {
    return;
  }
  const point = toCanvasPoint(event);
  skipNextClick = false;
  hasMoved = false;
  draggedVertexId.value = vertex.id;
  pressPoint = point;
  grabOffset = { x: point.x - vertex.x, y: point.y - vertex.y };
  window.addEventListener("pointermove", onWindowPointerMove);
  window.addEventListener("pointerup", onWindowPointerUp);
}

function onWindowPointerMove(event: PointerEvent) {
  if (draggedVertexId.value === null) {
    return;
  }
  const point = toCanvasPoint(event);
  if (!hasMoved) {
    const dx = Math.abs(point.x - pressPoint.x);
    const dy = Math.abs(point.y - pressPoint.y);
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      return;
    }
    hasMoved = true;
    emit("before-change", props.graph);
  }
  const position = keepInside(point.x - grabOffset.x, point.y - grabOffset.y);
  emit("update:graph", moveVertex(props.graph, draggedVertexId.value, position.x, position.y));
}

function onWindowPointerUp() {
  if (hasMoved) {
    skipNextClick = true;
  }
  hasMoved = false;
  draggedVertexId.value = null;
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
}

function onVertexClick(vertexId: string) {
  if (skipNextClick) {
    skipNextClick = false;
    return;
  }
  if (selectedVertexId.value === null) {
    selectedVertexId.value = vertexId;
    return;
  }
  applyChange(addEdge(props.graph, selectedVertexId.value, vertexId));
  clearSelection();
}

function onVertexRightClick(vertexId: string) {
  applyChange(removeVertex(props.graph, vertexId));
  clearSelection();
}

function onEdgeRightClick(edgeId: string) {
  applyChange(removeEdge(props.graph, edgeId));
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    clearSelection();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  onWindowPointerUp();
});
</script>

<template>
  <svg
    ref="svgElement"
    class="graph-canvas"
    @click.self="onCanvasClick"
    @pointermove="onCanvasPointerMove"
    @pointerleave="onCanvasPointerLeave"
  >
    <defs>
      <marker
        id="graph-canvas-arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="11"
        markerHeight="11"
        markerUnits="userSpaceOnUse"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" class="graph-canvas__arrow" />
      </marker>
    </defs>

    <line
      v-if="selectedVertex && cursorPoint"
      :x1="selectedVertex.x"
      :y1="selectedVertex.y"
      :x2="cursorPoint.x"
      :y2="cursorPoint.y"
      class="graph-canvas__preview"
    />

    <g
      v-for="shape in edgeShapes"
      :key="shape.id"
      class="graph-canvas__edge"
      @contextmenu.prevent="onEdgeRightClick(shape.id)"
    >
      <path :d="shape.path" class="graph-canvas__edge-hit" />
      <path
        :d="shape.path"
        class="graph-canvas__edge-line"
        :marker-end="graph.isDirected ? 'url(#graph-canvas-arrow)' : undefined"
      />
    </g>

    <g
      v-for="vertex in graph.vertices"
      :key="vertex.id"
      class="graph-canvas__vertex"
      :class="{
        'graph-canvas__vertex--selected': vertex.id === selectedVertexId,
        'graph-canvas__vertex--dragged': vertex.id === draggedVertexId,
      }"
      @pointerdown="onVertexPointerDown($event, vertex)"
      @click.stop="onVertexClick(vertex.id)"
      @contextmenu.prevent="onVertexRightClick(vertex.id)"
    >
      <circle :cx="vertex.x" :cy="vertex.y" :r="VERTEX_RADIUS" />
      <text :x="vertex.x" :y="vertex.y + 5" text-anchor="middle">{{ vertex.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
.graph-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--graph-canvas-bg);
  user-select: none;
  touch-action: none;
}

.graph-canvas__preview {
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}

.graph-canvas__edge {
  cursor: context-menu;
}

.graph-canvas__edge-hit {
  fill: none;
  stroke: transparent;
  stroke-width: 14;
  pointer-events: stroke;
}

.graph-canvas__edge-line {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 2;
  pointer-events: none;
}

.graph-canvas__edge:hover .graph-canvas__edge-line {
  stroke: var(--color-accent);
}

.graph-canvas__arrow {
  fill: var(--graph-edge);
}

.graph-canvas__vertex {
  cursor: grab;
}

.graph-canvas__vertex circle {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
}

.graph-canvas__vertex--selected circle {
  stroke: var(--color-accent);
  stroke-width: 3;
}

.graph-canvas__vertex--dragged {
  cursor: grabbing;
}

.graph-canvas__vertex text {
  fill: var(--graph-vertex-text);
  font-size: 14px;
  pointer-events: none;
}
</style>
