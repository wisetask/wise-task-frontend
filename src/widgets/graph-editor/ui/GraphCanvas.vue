<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  addEdge,
  addVertex,
  findVertex,
  removeEdge,
  removeVertex,
  updateEdge,
  updateVertex,
  type Graph,
  type GraphColor,
  type Vertex,
} from "@/entities/graph";
import type { MenuAction, MenuTarget } from "../lib/contextMenu";
import { buildEdgeShapes, VERTEX_RADIUS, type Point } from "../lib/geometry";
import { isTyping, toCanvasPoint } from "../lib/pointer";
import {
  isSelected,
  isSelectionValid,
  type EditorTool,
  type GraphSelection,
} from "../lib/selection";
import { useCanvasMenu } from "../lib/useCanvasMenu";
import { useCanvasPan } from "../lib/useCanvasPan";
import { useVertexDrag } from "../lib/useVertexDrag";
import { useViewport } from "../lib/useViewport";
import GraphArrowMarkers from "./GraphArrowMarkers.vue";
import GraphContextMenu from "./GraphContextMenu.vue";
import GraphEdgeItem from "./GraphEdgeItem.vue";
import GraphVertexItem from "./GraphVertexItem.vue";
import GraphZoomControls from "./GraphZoomControls.vue";

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
const {
  transform,
  percent,
  toWorld,
  limitToView,
  zoomIn,
  zoomOut,
  setPercent,
  zoomByWheel,
  pan: panViewport,
  reset: resetViewport,
} = useViewport(svgElement);

const { draggedVertexId, startDrag, consumeClick } = useVertexDrag({
  toWorld: toWorld,
  limit: limitToView,
  getGraph: () => props.graph,
  onStart: () => emit("before-change", props.graph),
  onMove: (graph) => emit("update:graph", graph),
});

const pan = useCanvasPan({ onPan: panViewport });
const isPanning = pan.isPanning;

const edgeShapes = computed(() => buildEdgeShapes(props.graph, VERTEX_RADIUS));

const edgeSource = computed(() => {
  if (edgeSourceId.value === null) {
    return undefined;
  }
  return findVertex(props.graph, edgeSourceId.value);
});

const {
  menu,
  items: menuItems,
  showColors: menuShowsColors,
  currentColor: menuColor,
  open: openMenuAt,
  close: closeMenu,
  takeTarget: takeMenuTarget,
} = useCanvasMenu(() => props.graph);

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

function addVertexAt(point: Point) {
  const newGraph = addVertex(props.graph, point.x, point.y);
  const newVertex = newGraph.vertices[newGraph.vertices.length - 1];
  applyChange(newGraph);
  select({ kind: "vertex", id: newVertex.id });
}

function onZoomIn() {
  closeMenu();
  zoomIn();
}

function onZoomOut() {
  closeMenu();
  zoomOut();
}

function onSetPercent(percent: number) {
  closeMenu();
  setPercent(percent);
}

function resetZoom() {
  closeMenu();
  resetViewport();
}

function onWheel(event: WheelEvent) {
  closeMenu();
  zoomByWheel(event);
}

function onBackgroundPointerDown(event: PointerEvent) {
  const isMiddle = event.button === 1;
  const isLeftOutsideVertexTool = event.button === 0 && props.tool !== "vertex";
  if (isMiddle || isLeftOutsideVertexTool) {
    closeMenu();
    pan.startPan(event);
  }
}

function onBackgroundMouseDown(event: MouseEvent) {
  if (event.button === 1) {
    event.preventDefault();
  }
}

function onCanvasClick(event: MouseEvent) {
  if (pan.consumeClick() || consumeClick()) {
    return;
  }
  if (props.tool === "vertex") {
    addVertexAt(toWorld(event));
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
    cursorPoint.value = toWorld(event);
  }
}

function onCanvasPointerLeave() {
  cursorPoint.value = null;
}

function onVertexPointerDown(event: PointerEvent, vertex: Vertex) {
  if (event.button !== 0 || props.tool === "delete") {
    return;
  }
  closeMenu();
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

function openMenu(event: MouseEvent, target: MenuTarget) {
  cancelEdge();
  if (svgElement.value === null) {
    return;
  }
  const box = svgElement.value.getBoundingClientRect();
  const point = toCanvasPoint(svgElement.value, event);
  openMenuAt(target, point, box.width, box.height);
}

function onVertexMenu(event: MouseEvent, vertexId: string) {
  select({ kind: "vertex", id: vertexId });
  openMenu(event, { kind: "vertex", id: vertexId });
}

function onEdgeMenu(event: MouseEvent, edgeId: string) {
  select({ kind: "edge", id: edgeId });
  openMenu(event, { kind: "edge", id: edgeId });
}

function onBackgroundMenu(event: MouseEvent) {
  const point = toWorld(event);
  openMenu(event, { kind: "canvas", x: point.x, y: point.y });
}

function onMenuChoose(action: MenuAction) {
  const target = takeMenuTarget();
  if (target === null) {
    return;
  }
  if (action === "reset-zoom") {
    resetZoom();
  } else if (action === "add-vertex" && target.kind === "canvas") {
    addVertexAt({ x: target.x, y: target.y });
  } else if (action === "add-loop" && target.kind === "vertex") {
    applyChange(addEdge(props.graph, target.id, target.id));
  } else if (action === "delete" && target.kind === "vertex") {
    deleteVertex(target.id);
  } else if (action === "delete" && target.kind === "edge") {
    deleteEdge(target.id);
  }
}

function onMenuColor(color: GraphColor) {
  const target = takeMenuTarget();
  if (target === null) {
    return;
  }
  if (target.kind === "vertex") {
    applyChange(updateVertex(props.graph, target.id, { color: color }));
  } else if (target.kind === "edge") {
    applyChange(updateEdge(props.graph, target.id, { color: color }));
  }
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
    if (menu.value !== null) {
      closeMenu();
      return;
    }
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
    closeMenu();
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
  <div class="graph-canvas">
    <svg
      ref="svgElement"
      class="graph-canvas__svg"
      :class="['graph-canvas__svg--tool-' + tool, { 'graph-canvas__svg--panning': isPanning }]"
      @click.self="onCanvasClick"
      @pointerdown.self="onBackgroundPointerDown"
      @mousedown.self="onBackgroundMouseDown"
      @contextmenu.self.prevent="onBackgroundMenu"
      @pointermove="onCanvasPointerMove"
      @pointerleave="onCanvasPointerLeave"
      @wheel.prevent="onWheel"
    >
      <GraphArrowMarkers />

      <g :transform="transform">
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
          @menu="onEdgeMenu($event, shape.id)"
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
          @menu="onVertexMenu($event, vertex.id)"
        />
      </g>
    </svg>

    <GraphZoomControls
      :percent="percent"
      @zoom-in="onZoomIn"
      @zoom-out="onZoomOut"
      @set-percent="onSetPercent"
    />

    <GraphContextMenu
      v-if="menu"
      :left="menu.left"
      :top="menu.top"
      :items="menuItems"
      :show-colors="menuShowsColors"
      :current-color="menuColor"
      @choose="onMenuChoose"
      @color="onMenuColor"
      @close="closeMenu"
    />
  </div>
</template>

<style scoped>
.graph-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.graph-canvas__svg {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--graph-canvas-bg);
  user-select: none;
  touch-action: none;
}

.graph-canvas__svg--tool-select,
.graph-canvas__svg--tool-edge,
.graph-canvas__svg--tool-delete {
  cursor: grab;
}

.graph-canvas__svg--tool-vertex {
  cursor: crosshair;
}

.graph-canvas__svg--panning {
  cursor: grabbing;
}

.graph-canvas__preview {
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}
</style>
