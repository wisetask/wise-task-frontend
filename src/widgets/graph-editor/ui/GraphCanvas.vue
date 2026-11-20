<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { findVertex, type Graph, type GraphColor, type Vertex } from "@/entities/graph";
import { copySelection, type GraphClipboard } from "../lib/clipboard";
import { layoutOfAction, type MenuAction, type MenuTarget } from "../lib/contextMenu";
import { buildEdgeShapes, VERTEX_RADIUS, type Point } from "../lib/geometry";
import { toCanvasPoint, wantsToggle } from "../lib/pointer";
import {
  isSelected,
  selectInArea,
  toggleSelected,
  verticesToMove,
  type EditorTool,
  type GraphSelection,
} from "../lib/selection";
import { useBoxSelect } from "../lib/useBoxSelect";
import { useCanvasMenu } from "../lib/useCanvasMenu";
import { useCanvasPan } from "../lib/useCanvasPan";
import { useGraphEdits } from "../lib/useGraphEdits";
import { useVertexDrag } from "../lib/useVertexDrag";
import { useViewport } from "../lib/useViewport";
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
    panMode?: boolean;
  }>(),
  {
    tool: "select",
    selection: null,
    readonly: false,
    panMode: false,
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
const pointerPoint = ref<Point | null>(null);

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

const edits = useGraphEdits({
  getGraph: () => props.graph,
  getSelection: () => props.selection,
  onChange: (before, after) => {
    emit("before-change", before);
    emit("update:graph", after);
  },
  onSelect: select,
});

const { draggedVertexId, startDrag, consumeClick } = useVertexDrag({
  toWorld: toWorld,
  limit: limitToView,
  getGraph: () => props.graph,
  getGroup: (vertexId) => verticesToMove(props.selection, vertexId),
  onStart: () => emit("before-change", props.graph),
  onMove: (graph) => emit("update:graph", graph),
});

const pan = useCanvasPan({ onPan: panViewport });

const boxSelect = useBoxSelect({
  toWorld: toWorld,
  onSelect: (area) => select(selectInArea(props.graph, area)),
});
const box = boxSelect.box;

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
      "graph-canvas__svg--space": props.panMode,
      "graph-canvas__svg--panning": pan.isPanning.value,
    },
  ];
});

const ignoresClicks = computed(() => props.readonly || props.tool === "pan");

function select(selection: GraphSelection | null) {
  emit("update:selection", selection);
}

function cancelEdge() {
  edgeSourceId.value = null;
  cursorPoint.value = null;
}

function deleteVertex(vertexId: string) {
  if (edgeSourceId.value === vertexId) {
    cancelEdge();
  }
  edits.deleteVertex(vertexId);
}

function deleteSelected() {
  cancelEdge();
  edits.deleteSelected();
}

function selectEverything() {
  cancelEdge();
  edits.selectEverything();
}

function cancel() {
  closeMenu();
  cancelEdge();
  if (!props.readonly) {
    select(null);
  }
}

function onZoomIn() {
  closeMenu();
  zoomIn();
}

function onZoomOut() {
  closeMenu();
  zoomOut();
}

function onSetPercent(value: number) {
  closeMenu();
  setPercent(value);
}

function resetZoom() {
  closeMenu();
  resetViewport();
}

function fitView() {
  closeMenu();
  fitTo(props.graph.vertices);
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
  if (props.readonly || props.panMode) {
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
  if (ignoresClicks.value) {
    return;
  }
  if (props.tool === "vertex") {
    edits.addVertexAt(toWorld(event));
  } else if (props.tool === "edge") {
    cancelEdge();
  } else if (props.tool === "select") {
    select(null);
  }
}

function onCanvasPointerMove(event: PointerEvent) {
  pointerPoint.value = toWorld(event);
  if (edgeSourceId.value !== null) {
    cursorPoint.value = pointerPoint.value;
  }
}

function onCanvasPointerLeave() {
  cursorPoint.value = null;
  pointerPoint.value = null;
}

function onVertexPointerDown(event: PointerEvent, vertex: Vertex) {
  if (ignoresClicks.value || props.panMode) {
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
  if (consumeClick() || pan.consumeClick() || ignoresClicks.value) {
    return;
  }
  if (props.tool === "delete") {
    deleteVertex(vertexId);
  } else if (props.tool === "edge") {
    connectTo(vertexId);
  } else if (wantsToggle(event)) {
    select(toggleSelected(props.selection, "vertex", vertexId));
  } else {
    select({ kind: "vertex", id: vertexId });
  }
}

function connectTo(vertexId: string) {
  if (edgeSourceId.value === null) {
    edgeSourceId.value = vertexId;
    return;
  }
  const sourceId = edgeSourceId.value;
  cancelEdge();
  edits.connect(sourceId, vertexId);
}

function onEdgeClick(event: MouseEvent, edgeId: string) {
  if (pan.consumeClick() || ignoresClicks.value) {
    return;
  }
  if (props.tool === "delete") {
    edits.deleteEdge(edgeId);
    return;
  }
  cancelEdge();
  if (wantsToggle(event)) {
    select(toggleSelected(props.selection, "edge", edgeId));
  } else {
    select({ kind: "edge", id: edgeId });
  }
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
  } else if (isInGroup(kind, id)) {
    openMenu(event, { kind: "group" });
  } else {
    select({ kind: kind, id: id });
    openMenu(event, { kind: kind, id: id });
  }
}

function onBackgroundMenu(event: MouseEvent) {
  if (props.readonly) {
    openMenu(event, { kind: "view" });
    return;
  }
  const point = toWorld(event);
  openMenu(event, { kind: "canvas", x: point.x, y: point.y });
}

function arrange(action: MenuAction) {
  const kind = layoutOfAction(action);
  if (kind === null) {
    return;
  }
  edits.arrange(kind);
  nextTick(() => {
    fitView();
  });
}

function onMenuChoose(action: MenuAction) {
  const target = takeMenuTarget();
  if (target === null) {
    return;
  }
  if (layoutOfAction(action) !== null) {
    arrange(action);
  } else if (action === "reset-zoom") {
    resetZoom();
  } else if (action === "fit-view") {
    fitView();
  } else if (action === "add-vertex" && target.kind === "canvas") {
    edits.addVertexAt({ x: target.x, y: target.y });
  } else if (action === "add-loop" && target.kind === "vertex") {
    edits.addLoop(target.id);
  } else if (action === "delete" && target.kind === "vertex") {
    deleteVertex(target.id);
  } else if (action === "delete" && target.kind === "edge") {
    edits.deleteEdge(target.id);
  } else if (action === "delete" && target.kind === "group") {
    deleteSelected();
  }
}

function onMenuColor(color: GraphColor) {
  const target = takeMenuTarget();
  if (target !== null) {
    edits.paint(target, color);
  }
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
  if (props.readonly) {
    fitView();
  }
});

function copy(): GraphClipboard | null {
  return copySelection(props.graph, props.selection);
}

function pointerPosition(): Point | null {
  return pointerPoint.value;
}

function paste(clipboard: GraphClipboard, shift: Point) {
  if (props.readonly) {
    return;
  }
  cancelEdge();
  closeMenu();
  edits.paste(clipboard, shift);
}

defineExpose({
  zoomIn: onZoomIn,
  zoomOut: onZoomOut,
  resetZoom: resetZoom,
  fitView: fitView,
  selectAll: selectEverything,
  deleteSelected: deleteSelected,
  copy: copy,
  paste: paste,
  pointerPosition: pointerPosition,
  cancel: cancel,
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
      :submenu-on-left="menu.submenuOnLeft"
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
