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
  paintSelected,
  removeSelected,
  selectAll,
  selectInArea,
  toggleSelected,
  verticesToMove,
  type EditorTool,
  type GraphSelection,
} from "../lib/selection";
import { useBoxSelect } from "../lib/useBoxSelect";
import { useCanvasMenu } from "../lib/useCanvasMenu";
import { useCanvasPan } from "../lib/useCanvasPan";
import { useVertexDrag } from "../lib/useVertexDrag";
import { useViewport } from "../lib/useViewport";
import type { Area } from "../lib/viewport";
import { zoomKeyAction, type ZoomKeyAction } from "../lib/zoomKeys";
import GraphArrowMarkers from "./GraphArrowMarkers.vue";
import GraphContextMenu from "./GraphContextMenu.vue";
import GraphEdgeItem from "./GraphEdgeItem.vue";
import GraphVertexItem from "./GraphVertexItem.vue";
import GraphZoomControls from "./GraphZoomControls.vue";

const props = withDefaults(
  defineProps<{
    graph: Graph;
    tool?: EditorTool;
    selection?: GraphSelection | null;
    readonly?: boolean;
  }>(),
  {
    tool: "select",
    selection: null,
    readonly: false,
  },
);

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
}>();

const svgElement = ref<SVGSVGElement | null>(null);
const edgeSourceId = ref<string | null>(null);
const cursorPoint = ref<Point | null>(null);
const isSpaceHeld = ref(false);
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
  fitTo,
} = useViewport(svgElement);

const { draggedVertexId, startDrag, consumeClick } = useVertexDrag({
  toWorld: toWorld,
  limit: limitToView,
  getGraph: () => props.graph,
  getGroup: (vertexId) => verticesToMove(props.selection, vertexId),
  onStart: () => emit("before-change", props.graph),
  onMove: (graph) => emit("update:graph", graph),
});

const pan = useCanvasPan({ onPan: panViewport });
const isPanning = pan.isPanning;

const boxSelect = useBoxSelect({
  toWorld: toWorld,
  onSelect: selectArea,
});
const box = boxSelect.box;

const edgeShapes = computed(() => buildEdgeShapes(props.graph, VERTEX_RADIUS));

const edgeSource = computed(() => {
  if (edgeSourceId.value === null) {
    return undefined;
  }
  return findVertex(props.graph, edgeSourceId.value);
});

const canvasClasses = computed(() => {
  return [
    props.readonly ? "graph-canvas__svg--readonly" : "graph-canvas__svg--tool-" + props.tool,
    {
      "graph-canvas__svg--space": isSpaceHeld.value,
      "graph-canvas__svg--panning": isPanning.value,
    },
  ];
});

const {
  menu,
  items: menuItems,
  showColors: menuShowsColors,
  currentColor: menuColor,
  open: openMenuAt,
  close: closeMenu,
  takeTarget: takeMenuTarget,
} = useCanvasMenu(
  () => props.graph,
  () => props.selection,
);

function select(selection: GraphSelection | null) {
  emit("update:selection", selection);
}

function selectArea(area: Area) {
  select(selectInArea(props.graph, area));
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

function deleteSelected() {
  if (props.selection === null) {
    return;
  }
  cancelEdge();
  applyChange(removeSelected(props.graph, props.selection));
  select(null);
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

function fitView() {
  closeMenu();
  fitTo(props.graph.vertices);
}

function runZoomKey(action: ZoomKeyAction) {
  if (action === "zoom-in") {
    onZoomIn();
  } else if (action === "zoom-out") {
    onZoomOut();
  } else if (action === "reset") {
    resetZoom();
  } else {
    fitView();
  }
}

function onWheel(event: WheelEvent) {
  if (props.readonly && !event.ctrlKey) {
    return;
  }
  event.preventDefault();
  closeMenu();
  zoomByWheel(event);
}

function wantsPan(event: PointerEvent): boolean {
  if (event.button === 1) {
    return true;
  }
  if (event.button !== 0) {
    return false;
  }
  if (props.readonly || isSpaceHeld.value) {
    return true;
  }
  return props.tool === "pan" || props.tool === "edge" || props.tool === "delete";
}

function onBackgroundPointerDown(event: PointerEvent) {
  if (wantsPan(event)) {
    closeMenu();
    pan.startPan(event);
    return;
  }
  if (event.button === 0 && props.tool === "select") {
    closeMenu();
    boxSelect.startBox(event);
  }
}

function onBackgroundMouseDown(event: MouseEvent) {
  if (event.button === 1) {
    event.preventDefault();
  }
}

function onCanvasClick(event: MouseEvent) {
  if (pan.consumeClick() || boxSelect.consumeClick() || consumeClick()) {
    return;
  }
  if (props.readonly || props.tool === "pan") {
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
  if (props.readonly || isSpaceHeld.value || props.tool === "pan") {
    onBackgroundPointerDown(event);
    return;
  }
  if (event.button !== 0 || props.tool === "delete") {
    return;
  }
  closeMenu();
  startDrag(event, vertex);
}

function onVertexClick(event: MouseEvent, vertexId: string) {
  if (consumeClick() || pan.consumeClick() || props.readonly || props.tool === "pan") {
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
  if (event.shiftKey) {
    select(toggleSelected(props.selection, "vertex", vertexId));
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

function onEdgeClick(event: MouseEvent, edgeId: string) {
  if (pan.consumeClick() || props.readonly || props.tool === "pan") {
    return;
  }
  if (props.tool === "delete") {
    deleteEdge(edgeId);
    return;
  }
  cancelEdge();
  if (event.shiftKey) {
    select(toggleSelected(props.selection, "edge", edgeId));
    return;
  }
  select({ kind: "edge", id: edgeId });
}

function openMenu(event: MouseEvent, target: MenuTarget) {
  cancelEdge();
  if (svgElement.value === null) {
    return;
  }
  const bounds = svgElement.value.getBoundingClientRect();
  const point = toCanvasPoint(svgElement.value, event);
  openMenuAt(target, point, bounds.width, bounds.height);
}

function isInGroup(kind: "vertex" | "edge", id: string): boolean {
  if (props.selection === null || props.selection.kind !== "group") {
    return false;
  }
  return isSelected(props.selection, kind, id);
}

function onItemMenu(event: MouseEvent, kind: "vertex" | "edge", id: string) {
  if (props.readonly) {
    openMenu(event, { kind: "view" });
    return;
  }
  if (isInGroup(kind, id)) {
    openMenu(event, { kind: "group" });
    return;
  }
  select({ kind: kind, id: id });
  openMenu(event, { kind: kind, id: id });
}

function onBackgroundMenu(event: MouseEvent) {
  if (props.readonly) {
    openMenu(event, { kind: "view" });
    return;
  }
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
  } else if (action === "fit-view") {
    fitView();
  } else if (action === "add-vertex" && target.kind === "canvas") {
    addVertexAt({ x: target.x, y: target.y });
  } else if (action === "add-loop" && target.kind === "vertex") {
    applyChange(addEdge(props.graph, target.id, target.id));
  } else if (action === "delete" && target.kind === "vertex") {
    deleteVertex(target.id);
  } else if (action === "delete" && target.kind === "edge") {
    deleteEdge(target.id);
  } else if (action === "delete" && target.kind === "group") {
    deleteSelected();
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
  } else if (target.kind === "group") {
    applyChange(paintSelected(props.graph, props.selection, color));
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (menu.value !== null) {
      closeMenu();
      return;
    }
    cancelEdge();
    if (!props.readonly) {
      select(null);
    }
    return;
  }
  if (props.readonly || isTyping(event)) {
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    isSpaceHeld.value = true;
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.code === "KeyA") {
    event.preventDefault();
    cancelEdge();
    select(selectAll(props.graph));
    return;
  }
  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    const zoomAction = zoomKeyAction(event.code, event.shiftKey);
    if (zoomAction !== null) {
      event.preventDefault();
      runZoomKey(zoomAction);
      return;
    }
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    if (props.selection !== null) {
      event.preventDefault();
      deleteSelected();
    }
  }
}

function onKeyUp(event: KeyboardEvent) {
  if (event.code === "Space") {
    isSpaceHeld.value = false;
  }
}

function onWindowBlur() {
  isSpaceHeld.value = false;
}

watch(
  () => props.tool,
  () => {
    cancelEdge();
    closeMenu();
  },
);

watch(
  () => props.readonly,
  (isReadonly) => {
    cancelEdge();
    closeMenu();
    if (isReadonly) {
      fitView();
    }
  },
);

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);
  if (props.readonly) {
    fitView();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("blur", onWindowBlur);
});
</script>

<template>
  <div class="graph-canvas">
    <svg
      ref="svgElement"
      class="graph-canvas__svg"
      :class="canvasClasses"
      @click.self="onCanvasClick"
      @pointerdown.self="onBackgroundPointerDown"
      @mousedown.self="onBackgroundMouseDown"
      @contextmenu.self.prevent="onBackgroundMenu"
      @pointermove="onCanvasPointerMove"
      @pointerleave="onCanvasPointerLeave"
      @wheel="onWheel"
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
          @pick="onEdgeClick($event, shape.id)"
          @menu="onItemMenu($event, 'edge', shape.id)"
        />

        <GraphVertexItem
          v-for="vertex in graph.vertices"
          :key="vertex.id"
          :vertex="vertex"
          :selected="isSelected(selection, 'vertex', vertex.id)"
          :highlighted="vertex.id === edgeSourceId"
          :dragged="vertex.id === draggedVertexId"
          :draggable="!readonly && tool !== 'delete' && tool !== 'pan'"
          @grab="onVertexPointerDown($event, vertex)"
          @pick="onVertexClick($event, vertex.id)"
          @menu="onItemMenu($event, 'vertex', vertex.id)"
        />

        <rect
          v-if="box"
          class="graph-canvas__box"
          :x="box.left"
          :y="box.top"
          :width="box.right - box.left"
          :height="box.bottom - box.top"
        />
      </g>
    </svg>

    <GraphZoomControls
      :percent="percent"
      @zoom-in="onZoomIn"
      @zoom-out="onZoomOut"
      @set-percent="onSetPercent"
      @fit="fitView"
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

.graph-canvas__svg--tool-select {
  cursor: default;
}

.graph-canvas__svg--tool-pan,
.graph-canvas__svg--tool-edge,
.graph-canvas__svg--tool-delete,
.graph-canvas__svg--readonly,
.graph-canvas__svg--space {
  cursor: grab;
}

.graph-canvas__svg--tool-pan :deep(.graph-vertex),
.graph-canvas__svg--tool-pan :deep(.graph-edge),
.graph-canvas__svg--readonly :deep(.graph-vertex),
.graph-canvas__svg--readonly :deep(.graph-edge),
.graph-canvas__svg--space :deep(.graph-vertex),
.graph-canvas__svg--space :deep(.graph-edge) {
  cursor: inherit;
}

.graph-canvas__svg--tool-vertex {
  cursor: crosshair;
}

.graph-canvas__svg--panning {
  cursor: grabbing;
}

.graph-canvas__box {
  fill: var(--color-accent-muted);
  fill-opacity: 0.5;
  stroke: var(--color-accent);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.graph-canvas__preview {
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}
</style>
