<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  addEdge,
  addVertex,
  findVertex,
  removeEdge,
  removeVertex,
  type Graph,
  type Vertex,
} from "@/entities/graph";
import { buildEdgeShapes, VERTEX_RADIUS, type Point } from "../lib/geometry";
import { isTyping, toCanvasPoint } from "../lib/pointer";
import {
  isSelected,
  isSelectionValid,
  type EditorTool,
  type GraphSelection,
} from "../lib/selection";
import { useVertexDrag } from "../lib/useVertexDrag";
import GraphArrowMarkers from "./GraphArrowMarkers.vue";
import GraphEdgeItem from "./GraphEdgeItem.vue";
import GraphVertexItem from "./GraphVertexItem.vue";

const props = defineProps<{
  graph: Graph;
  tool: EditorTool;
  selection: GraphSelection | null;
}>();

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
}>();

const svgElement = ref<SVGSVGElement | null>(null);
const edgeSourceId = ref<string | null>(null);
const cursorPoint = ref<Point | null>(null);

const { draggedVertexId, startDrag, consumeClick } = useVertexDrag(svgElement, {
  getGraph: () => props.graph,
  onStart: () => emit("before-change", props.graph),
  onMove: (graph) => emit("update:graph", graph),
});

const edgeShapes = computed(() => buildEdgeShapes(props.graph, VERTEX_RADIUS));

const edgeSource = computed(() => {
  if (edgeSourceId.value === null) {
    return undefined;
  }
  return findVertex(props.graph, edgeSourceId.value);
});

function select(selection: GraphSelection | null) {
  emit("update:selection", selection);
}

function applyChange(newGraph: Graph) {
  if (newGraph === props.graph) {
    return;
  }
  emit("before-change", props.graph);
  emit("update:graph", newGraph);
  if (props.selection !== null && !isSelectionValid(newGraph, props.selection)) {
    select(null);
  }
}

function cancelEdge() {
  edgeSourceId.value = null;
  cursorPoint.value = null;
}

function deleteVertex(vertexId: string) {
  if (edgeSourceId.value === vertexId) {
    cancelEdge();
  }
  applyChange(removeVertex(props.graph, vertexId));
}

function deleteEdge(edgeId: string) {
  applyChange(removeEdge(props.graph, edgeId));
}

function onCanvasClick(event: MouseEvent) {
  if (consumeClick()) {
    return;
  }
  if (props.tool === "vertex") {
    const point = toCanvasPoint(svgElement.value, event);
    const newGraph = addVertex(props.graph, point.x, point.y);
    const newVertex = newGraph.vertices[newGraph.vertices.length - 1];
    applyChange(newGraph);
    select({ kind: "vertex", id: newVertex.id });
    return;
  }
  if (props.tool === "edge") {
    cancelEdge();
    return;
  }
  if (props.tool === "select") {
    select(null);
  }
}

function onCanvasPointerMove(event: PointerEvent) {
  if (edgeSourceId.value !== null) {
    cursorPoint.value = toCanvasPoint(svgElement.value, event);
  }
}

function onCanvasPointerLeave() {
  cursorPoint.value = null;
}

function onVertexPointerDown(event: PointerEvent, vertex: Vertex) {
  if (event.button !== 0 || props.tool === "delete") {
    return;
  }
  startDrag(event, vertex);
}

function onVertexClick(vertexId: string) {
  if (consumeClick()) {
    return;
  }
  if (props.tool === "delete") {
    deleteVertex(vertexId);
    return;
  }
  if (props.tool === "edge") {
    connectTo(vertexId);
    return;
  }
  select({ kind: "vertex", id: vertexId });
}

function connectTo(vertexId: string) {
  if (edgeSourceId.value === null) {
    edgeSourceId.value = vertexId;
    return;
  }
  const newGraph = addEdge(props.graph, edgeSourceId.value, vertexId);
  cancelEdge();
  if (newGraph === props.graph) {
    return;
  }
  const newEdge = newGraph.edges[newGraph.edges.length - 1];
  applyChange(newGraph);
  select({ kind: "edge", id: newEdge.id });
}

function onEdgeClick(edgeId: string) {
  if (props.tool === "delete") {
    deleteEdge(edgeId);
    return;
  }
  cancelEdge();
  select({ kind: "edge", id: edgeId });
}

function deleteSelected() {
  if (props.selection === null) {
    return;
  }
  if (props.selection.kind === "vertex") {
    deleteVertex(props.selection.id);
  } else {
    deleteEdge(props.selection.id);
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    cancelEdge();
    select(null);
    return;
  }
  if ((event.key === "Delete" || event.key === "Backspace") && !isTyping(event)) {
    if (props.selection !== null) {
      event.preventDefault();
      deleteSelected();
    }
  }
}

watch(
  () => props.tool,
  () => {
    cancelEdge();
  },
);

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <svg
    ref="svgElement"
    class="graph-canvas"
    :class="'graph-canvas--tool-' + tool"
    @click.self="onCanvasClick"
    @pointermove="onCanvasPointerMove"
    @pointerleave="onCanvasPointerLeave"
  >
    <GraphArrowMarkers />

    <line
      v-if="edgeSource && cursorPoint"
      :x1="edgeSource.x"
      :y1="edgeSource.y"
      :x2="cursorPoint.x"
      :y2="cursorPoint.y"
      class="graph-canvas__preview"
    />

    <GraphEdgeItem
      v-for="shape in edgeShapes"
      :key="shape.id"
      :shape="shape"
      :selected="isSelected(selection, 'edge', shape.id)"
      :directed="graph.isDirected"
      @pick="onEdgeClick(shape.id)"
      @remove="deleteEdge(shape.id)"
    />

    <GraphVertexItem
      v-for="vertex in graph.vertices"
      :key="vertex.id"
      :vertex="vertex"
      :selected="isSelected(selection, 'vertex', vertex.id)"
      :highlighted="vertex.id === edgeSourceId"
      :dragged="vertex.id === draggedVertexId"
      :draggable="tool !== 'delete'"
      @grab="onVertexPointerDown($event, vertex)"
      @pick="onVertexClick(vertex.id)"
      @remove="deleteVertex(vertex.id)"
    />
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

.graph-canvas--tool-vertex {
  cursor: crosshair;
}

.graph-canvas__preview {
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}
</style>
