<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { findVertex, type Graph, type GraphColor, type Vertex } from "@/entities/graph";
import { emptyCanvasText, litParts } from "../lib/canvasLook";
import type { VertexWave } from "../lib/celebrations";
import { copySelection, type GraphClipboard } from "../lib/clipboard";
import { layoutOfAction, menuTitle, type MenuAction, type MenuTarget } from "../lib/contextMenu";
import { degreeMap } from "../lib/degrees";
import { buildEdgeShapes, vertexAt, VERTEX_RADIUS, type Point } from "../lib/geometry";
import { toCanvasPoint, wantsToggle } from "../lib/pointer";
import { canRename, currentLabel, newLabel, renamePoint, type RenameTarget } from "../lib/rename";
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
import { allowEverything, type EditorRules } from "../lib/rules";
import { useCanvasPan } from "../lib/useCanvasPan";
import { useEdgeDrag } from "../lib/useEdgeDrag";
import { useGraphEdits } from "../lib/useGraphEdits";
import { useVertexDrag } from "../lib/useVertexDrag";
import { useViewport } from "../lib/useViewport";
import GraphArrowMarkers from "./GraphArrowMarkers.vue";
import GraphContextMenu from "./GraphContextMenu.vue";
import GraphEdgeItem from "./GraphEdgeItem.vue";
import GraphRenameField from "./GraphRenameField.vue";
import GraphVertexItem from "./GraphVertexItem.vue";
import GraphZoomControls from "./GraphZoomControls.vue";

const props = withDefaults(
  defineProps<{
    graph: Graph;
    tool?: EditorTool;
    selection?: GraphSelection | null;
    readonly?: boolean;
    panMode?: boolean;
    rules?: EditorRules;
    showDegrees?: boolean;
    wave?: VertexWave | null;
  }>(),
  {
    tool: "select",
    selection: null,
    readonly: false,
    panMode: false,
    rules: () => allowEverything(),
    showDegrees: false,
    wave: null,
  },
);

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
}>();

const svgElement = ref<SVGSVGElement | null>(null);
const edgeSourceId = ref<string | null>(null);
const hoveredVertexId = ref<string | null>(null);
const gridId = "graph-grid-" + useId();

interface Ghost {
  key: number;
  x: number;
  y: number;
}

const MAX_GHOSTS = 40;
const ghosts = ref<Ghost[]>([]);
let ghostCount = 0;
const ghostTimers: number[] = [];

const lit = computed(() => litParts(props.graph, hoveredVertexId.value));

const emptyText = computed(() => emptyCanvasText(props.readonly, props.tool, props.rules.canAdd));

function onVertexEnter(id: string) {
  hoveredVertexId.value = id;
}

function onVertexLeave(id: string) {
  if (hoveredVertexId.value === id) {
    hoveredVertexId.value = null;
  }
}

function addGhosts(now: Graph, before: Graph) {
  const added: Ghost[] = [];
  for (const vertex of before.vertices) {
    if (added.length >= MAX_GHOSTS) {
      break;
    }
    if (findVertex(now, vertex.id) === undefined) {
      ghostCount = ghostCount + 1;
      added.push({ key: ghostCount, x: vertex.x, y: vertex.y });
    }
  }
  if (added.length === 0) {
    return;
  }
  ghosts.value = ghosts.value.concat(added);
  const lastKey = ghostCount;
  const timer = window.setTimeout(() => {
    ghosts.value = ghosts.value.filter((ghost) => ghost.key > lastKey);
  }, 500);
  ghostTimers.push(timer);
}

watch(
  () => props.graph,
  (now, before) => {
    if (before !== undefined && now.vertices.length < before.vertices.length) {
      addGhosts(now, before);
    }
  },
);

onBeforeUnmount(() => {
  for (const timer of ghostTimers) {
    window.clearTimeout(timer);
  }
});
const cursorPoint = ref<Point | null>(null);
const pointerPoint = ref<Point | null>(null);
const renaming = ref<RenameTarget | null>(null);

const {
  transform,
  percent,
  toWorld,
  toScreen,
  limitToView,
  zoomIn,
  zoomOut,
  setPercent,
  applyWheel,
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
  onMove: (after) => emit("update:graph", after),
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

const edgeDrag = useEdgeDrag({
  toWorld: toWorld,
  onStart: (sourceId) => {
    closeMenu();
    edgeSourceId.value = sourceId;
  },
  onMove: (point) => {
    cursorPoint.value = point;
  },
  onDrop: (sourceId, point) => {
    if (edgeSourceId.value !== sourceId) {
      return;
    }
    cancelEdge();
    const target = vertexAt(props.graph, point, VERTEX_RADIUS);
    if (target !== null && target.id !== sourceId) {
      edits.connect(sourceId, target.id);
    }
  },
});

const boxSelect = useBoxSelect({
  toWorld: toWorld,
  onSelect: (area) => select(selectInArea(props.graph, area)),
});
const box = boxSelect.box;

const {
  menu,
  items: menuItems,
  title: menuHeader,
  showColors: menuShowsColors,
  currentColor: menuColor,
  open: openMenuAt,
  close: closeMenu,
  takeTarget: takeMenuTarget,
} = useCanvasMenu(
  () => props.graph,
  () => props.selection,
  () => props.rules,
);

const edgeShapes = computed(() => buildEdgeShapes(props.graph, VERTEX_RADIUS));

const degrees = computed(() => {
  if (!props.showDegrees) {
    return null;
  }
  return degreeMap(props.graph);
});

function waveStepOf(id: string): number | null {
  if (props.wave === null) {
    return null;
  }
  const step = props.wave.steps[id];
  return step === undefined ? null : step;
}

function degreeOfVertex(id: string): number | null {
  if (degrees.value === null) {
    return null;
  }
  return degrees.value[id] ?? 0;
}

function edgeTitle(id: string): string {
  return menuTitle(props.graph, { kind: "edge", id: id });
}

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
      "graph-canvas__svg--linking": edgeDrag.isDragging.value,
    },
  ];
});

const renameField = computed(() => {
  if (renaming.value === null) {
    return null;
  }
  const point = renamePoint(props.graph, renaming.value, edgeShapes.value);
  const label = currentLabel(props.graph, renaming.value);
  if (point === null || label === null) {
    return null;
  }
  const screen = toScreen(point);
  return {
    key: renaming.value.kind + renaming.value.id,
    left: screen.x,
    top: screen.y,
    value: label,
  };
});

const verticesDraggable = computed(() => {
  if (props.readonly || !props.rules.canMove) {
    return false;
  }
  return props.tool === "select" || props.tool === "vertex";
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

function openRename(kind: "vertex" | "edge", id: string) {
  closeMenu();
  cancelEdge();
  select({ kind: kind, id: id });
  renaming.value = { kind: kind, id: id };
}

function startRename(kind: "vertex" | "edge", id: string) {
  if (props.rules.canEditLabels && canRename(kind, props.tool, props.readonly)) {
    openRename(kind, id);
  }
}

function renameSelected() {
  if (props.readonly || !props.rules.canEditLabels) {
    return;
  }
  if (props.selection === null || props.selection.kind === "group") {
    return;
  }
  openRename(props.selection.kind, props.selection.id);
}

function finishRename(text: string) {
  const target = renaming.value;
  renaming.value = null;
  if (target === null) {
    return;
  }
  const oldLabel = currentLabel(props.graph, target);
  if (oldLabel === null) {
    return;
  }
  const label = newLabel(target.kind, oldLabel, text);
  if (label !== null) {
    edits.rename(target, label);
  }
}

function cancelRename() {
  renaming.value = null;
}

function cancel() {
  closeMenu();
  cancelEdge();
  cancelRename();
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
  applyWheel(event);
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
  if (pan.consumeClick() || boxSelect.consumeClick() || edgeDrag.consumeClick() || consumeClick()) {
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
  if (props.tool === "edge") {
    edgeDrag.startEdge(event, vertex.id);
    return;
  }
  if (props.rules.canMove) {
    startDrag(event, vertex);
  }
}

function onVertexClick(event: MouseEvent, vertexId: string) {
  if (consumeClick() || edgeDrag.consumeClick() || pan.consumeClick() || ignoresClicks.value) {
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
  } else if (action === "rename" && (target.kind === "vertex" || target.kind === "edge")) {
    startRename(target.kind, target.id);
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
    cancelRename();
  },
);

watch(
  () => props.readonly,
  (isReadonly) => {
    cancelEdge();
    closeMenu();
    cancelRename();
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

function moveSelected(dx: number, dy: number, record: boolean) {
  if (props.readonly) {
    return;
  }
  closeMenu();
  edits.moveSelected(dx, dy, record);
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
  moveSelected: moveSelected,
  renameSelected: renameSelected,
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

      <defs>
        <pattern
          :id="gridId"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
          :patternTransform="transform"
        >
          <circle cx="14" cy="14" r="1.3" class="graph-canvas__dot" />
        </pattern>
      </defs>
      <rect class="graph-canvas__grid" width="100%" height="100%" :fill="'url(#' + gridId + ')'" />

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
          :title="edgeTitle(shape.id)"
          :lit="lit.edgeIds.includes(shape.id)"
          @pick="onEdgeClick($event, shape.id)"
          @rename="startRename('edge', shape.id)"
          @menu="onItemMenu($event, 'edge', shape.id)"
        />

        <GraphVertexItem
          v-for="vertex in graph.vertices"
          :key="vertex.id"
          :vertex="vertex"
          :selected="isSelected(selection, 'vertex', vertex.id)"
          :highlighted="vertex.id === edgeSourceId"
          :dragged="vertex.id === draggedVertexId"
          :draggable="verticesDraggable"
          :degree="degreeOfVertex(vertex.id)"
          :wave-step="waveStepOf(vertex.id)"
          :wave-key="wave === null ? 0 : wave.key"
          :lit="lit.vertexIds.includes(vertex.id)"
          @pointerenter="onVertexEnter(vertex.id)"
          @pointerleave="onVertexLeave(vertex.id)"
          @grab="onVertexPointerDown($event, vertex)"
          @pick="onVertexClick($event, vertex.id)"
          @rename="startRename('vertex', vertex.id)"
          @menu="onItemMenu($event, 'vertex', vertex.id)"
        />

        <circle
          v-for="ghost in ghosts"
          :key="ghost.key"
          :cx="ghost.x"
          :cy="ghost.y"
          :r="VERTEX_RADIUS"
          class="graph-canvas__ghost"
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

    <Transition name="graph-canvas-empty">
      <div v-if="graph.vertices.length === 0" class="graph-canvas__empty">
        <svg class="graph-canvas__empty-art" viewBox="0 0 160 110" aria-hidden="true">
          <path class="graph-canvas__empty-edge" style="--i: 0" d="M30 70 L80 25" pathLength="1" />
          <path class="graph-canvas__empty-edge" style="--i: 1" d="M80 25 L130 60" pathLength="1" />
          <path class="graph-canvas__empty-edge" style="--i: 2" d="M130 60 L75 92" pathLength="1" />
          <path class="graph-canvas__empty-edge" style="--i: 3" d="M75 92 L30 70" pathLength="1" />
          <path class="graph-canvas__empty-edge" style="--i: 4" d="M80 25 L75 92" pathLength="1" />
          <circle class="graph-canvas__empty-node" style="--i: 0" cx="30" cy="70" r="9" />
          <circle class="graph-canvas__empty-node" style="--i: 1" cx="80" cy="25" r="9" />
          <circle class="graph-canvas__empty-node" style="--i: 2" cx="130" cy="60" r="9" />
          <circle class="graph-canvas__empty-node" style="--i: 3" cx="75" cy="92" r="9" />
        </svg>
        <p class="graph-canvas__empty-text">{{ emptyText }}</p>
      </div>
    </Transition>

    <GraphRenameField
      v-if="renameField"
      :key="renameField.key"
      :left="renameField.left"
      :top="renameField.top"
      :value="renameField.value"
      @commit="finishRename"
      @cancel="cancelRename"
    />

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
      :title="menuHeader"
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
  background:
    radial-gradient(
      ellipse at 50% 35%,
      color-mix(in srgb, var(--color-accent) 7%, transparent),
      transparent 65%
    ),
    var(--graph-canvas-bg);
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

.graph-canvas__svg--linking,
.graph-canvas__svg--linking :deep(.graph-vertex) {
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
  animation: graph-canvas-ants-box 500ms linear infinite;
}

.graph-canvas__preview {
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
  animation: graph-canvas-ants-line 500ms linear infinite;
}

.graph-canvas__grid {
  pointer-events: none;
}

.graph-canvas__dot {
  fill: var(--graph-edge);
  opacity: 0.25;
}

.graph-canvas__ghost {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-canvas-ghost 450ms var(--ease-out) both;
}

.graph-canvas__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  width: min(320px, 80%);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.graph-canvas__empty-art {
  width: 160px;
  height: 110px;
}

.graph-canvas__empty-edge {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0.7;
  animation: graph-canvas-empty-edge 6s var(--ease-out) infinite;
  animation-delay: calc(1.3s + var(--i) * 0.3s);
}

.graph-canvas__empty-node {
  fill: var(--graph-vertex-fill);
  stroke: var(--color-accent);
  stroke-width: 2.5;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-canvas-empty-node 6s var(--ease-spring) infinite;
  animation-delay: calc(var(--i) * 0.35s);
}

.graph-canvas__empty-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.graph-canvas-empty-enter-active,
.graph-canvas-empty-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.graph-canvas-empty-enter-from,
.graph-canvas-empty-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.92);
}

@keyframes graph-canvas-ants-box {
  to {
    stroke-dashoffset: -7;
  }
}

@keyframes graph-canvas-ants-line {
  to {
    stroke-dashoffset: -10;
  }
}

@keyframes graph-canvas-ghost {
  from {
    opacity: 0.8;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.8);
  }
}

@keyframes graph-canvas-empty-node {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  8% {
    opacity: 1;
    transform: scale(1.15);
  }
  12% {
    transform: scale(1);
  }
  80% {
    opacity: 1;
    transform: scale(1);
  }
  92%,
  100% {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes graph-canvas-empty-edge {
  0% {
    stroke-dashoffset: 1;
    opacity: 0.7;
  }
  18% {
    stroke-dashoffset: 0;
  }
  70% {
    stroke-dashoffset: 0;
    opacity: 0.7;
  }
  82%,
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-canvas__box,
  .graph-canvas__preview,
  .graph-canvas__ghost {
    animation: none;
  }

  .graph-canvas__ghost {
    display: none;
  }

  .graph-canvas__empty-edge,
  .graph-canvas__empty-node {
    opacity: 1;
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
