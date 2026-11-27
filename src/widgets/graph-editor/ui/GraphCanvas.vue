<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { findEdge, findVertex, type Graph, type GraphColor, type Vertex } from "@/entities/graph";
import { motionAllowed } from "@/shared/lib/motion";
import type { AlgorithmStep } from "../lib/algorithms";
import { focusPoints } from "../lib/align";
import { componentOf, emptyCanvasText, litParts, snapVertex } from "../lib/canvasLook";
import {
  reelStopTime,
  reelSymbol,
  type CanvasMood,
  type Comet,
  type VertexWave,
} from "../lib/celebrations";
import { copySelection, type GraphClipboard } from "../lib/clipboard";
import { layoutOfAction, menuTitle, type MenuAction, type MenuTarget } from "../lib/contextMenu";
import { degreeMap } from "../lib/degrees";
import { GUIDE_SNAP, snapToGuides, type Guide } from "../lib/guides";
import {
  blendGraph,
  easeInOutCubic,
  easeOutCubic,
  fallGraph,
  orbitGraph,
  sharesMostVertices,
} from "../lib/motionMath";
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
    locked?: boolean;
    panMode?: boolean;
    rules?: EditorRules;
    showDegrees?: boolean;
    wave?: VertexWave | null;
    mood?: CanvasMood;
    comet?: Comet | null;
    glowIds?: string[];
    algorithmStep?: AlgorithmStep | null;
    showComponents?: boolean;
  }>(),
  {
    tool: "select",
    selection: null,
    readonly: false,
    locked: false,
    panMode: false,
    rules: () => allowEverything(),
    showDegrees: false,
    wave: null,
    mood: "",
    comet: null,
    glowIds: () => [],
    algorithmStep: null,
    showComponents: false,
  },
);

const emit = defineEmits<{
  "update:graph": [graph: Graph];
  "update:selection": [selection: GraphSelection | null];
  "before-change": [graph: Graph];
  "triple-click": [];
}>();

const svgElement = ref<SVGSVGElement | null>(null);
const viewOnly = computed(() => props.readonly || props.locked);
const edgeSourceId = ref<string | null>(null);
const hoveredVertexId = ref<string | null>(null);
const snapTargetId = ref<string | null>(null);
const guides = ref<Guide[]>([]);
const GROW_DISTANCE = VERTEX_RADIUS * 2.5;

const components = computed(() => {
  if (!props.showComponents) {
    return null;
  }
  return componentOf(props.graph);
});

function componentOfVertex(id: string): number | null {
  if (components.value === null) {
    return null;
  }
  const index = components.value[id];
  return index === undefined ? null : index;
}

function componentOfEdge(edgeId: string): number | null {
  if (components.value === null) {
    return null;
  }
  const edge = findEdge(props.graph, edgeId);
  if (edge === undefined) {
    return null;
  }
  return componentOfVertex(edge.source);
}

function componentDelay(id: string): number {
  const index = componentOfVertex(id);
  if (index === null) {
    return 0;
  }
  return Math.min(index * 120, 1200);
}

function farEnoughToGrow(sourceId: string, point: Point): boolean {
  const source = findVertex(props.graph, sourceId);
  if (source === undefined) {
    return false;
  }
  return Math.hypot(point.x - source.x, point.y - source.y) >= GROW_DISTANCE;
}

interface Coin {
  key: number;
  x: string;
  delay: string;
  duration: string;
}

const reelTick = ref(0);
const reelElapsed = ref(0);
let reelTimer = 0;
let reelStart = 0;

const coins = computed(() => {
  const list: Coin[] = [];
  if (props.mood !== "jackpot") {
    return list;
  }
  for (let i = 0; i < 40; i++) {
    list.push({
      key: i,
      x: (Math.random() * 100).toFixed(2) + "%",
      delay: (Math.random() * 1.6).toFixed(2) + "s",
      duration: (1.4 + Math.random() * 1.2).toFixed(2) + "s",
    });
  }
  return list;
});

function stopReels() {
  window.clearInterval(reelTimer);
  reelTimer = 0;
}

watch(
  () => props.mood,
  (mood) => {
    stopReels();
    reelTick.value = 0;
    reelElapsed.value = 0;
    if (mood !== "jackpot") {
      return;
    }
    reelStart = performance.now();
    reelTimer = window.setInterval(() => {
      reelTick.value = reelTick.value + 1;
      reelElapsed.value = performance.now() - reelStart;
      if (reelElapsed.value > reelStopTime(1000) + 100) {
        stopReels();
      }
    }, 80);
  },
);

function labelOverrideOf(index: number): string {
  if (props.mood !== "jackpot") {
    return "";
  }
  return reelSymbol(index, reelTick.value, reelElapsed.value >= reelStopTime(index));
}
const SNAP_RADIUS = 42;

interface Cut {
  key: number;
  x1: number;
  y1: number;
  middleX: number;
  middleY: number;
  x2: number;
  y2: number;
}

interface SkyStar {
  key: number;
  x: string;
  y: string;
  size: number;
  delay: string;
}

const MAX_CUTS = 40;
const FALL_MIN_VERTICES = 8;
const cuts = ref<Cut[]>([]);
const motionGraph = ref<Graph | null>(null);
const fadingGraph = ref<Graph | null>(null);
const stagger = ref(false);
let fadingKey = 0;
let fadeTimer = 0;
let jumpFrom: Graph | null = null;
const motionClass = ref("");
let motionTarget: Graph | null = null;
let motionFrame = 0;

const shownGraph = computed(() => {
  if (motionGraph.value !== null) {
    return motionGraph.value;
  }
  return props.graph;
});

const skyStars = computed(() => {
  const stars: SkyStar[] = [];
  if (props.mood !== "stars") {
    return stars;
  }
  for (let i = 0; i < 60; i++) {
    stars.push({
      key: i,
      x: (Math.random() * 100).toFixed(2) + "%",
      y: (Math.random() * 100).toFixed(2) + "%",
      size: 0.6 + Math.random() * 1.4,
      delay: (Math.random() * 2.4).toFixed(2) + "s",
    });
  }
  return stars;
});

const cometPath = computed(() => {
  if (props.comet === null || props.comet.points.length < 2) {
    return "";
  }
  let path = "";
  for (let i = 0; i < props.comet.points.length; i++) {
    const point = props.comet.points[i];
    path = path + (i === 0 ? "M" : " L") + point.x + " " + point.y;
  }
  return path;
});

function stopMotion() {
  if (motionFrame !== 0) {
    window.cancelAnimationFrame(motionFrame);
    motionFrame = 0;
  }
  motionGraph.value = null;
  motionClass.value = "";
  motionTarget = null;
}

function playMotion(duration: number, className: string, frame: (t: number) => Graph) {
  stopMotion();
  if (!motionAllowed() || typeof window.requestAnimationFrame !== "function") {
    return;
  }
  const startTime = performance.now();
  motionTarget = props.graph;
  motionClass.value = className;
  motionGraph.value = frame(0);
  function step(now: number) {
    const t = Math.min(1, (now - startTime) / duration);
    motionGraph.value = frame(t);
    if (t < 1) {
      motionFrame = window.requestAnimationFrame(step);
    } else {
      motionFrame = 0;
      stopMotion();
    }
  }
  motionFrame = window.requestAnimationFrame(step);
}

const fadingShapes = computed(() => {
  if (fadingGraph.value === null) {
    return [];
  }
  return buildEdgeShapes(fadingGraph.value, VERTEX_RADIUS);
});

function expectJump(before: Graph) {
  jumpFrom = before;
}

function crossfadeFrom(before: Graph) {
  fadingKey = fadingKey + 1;
  fadingGraph.value = before;
  stagger.value = true;
  window.clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(() => {
    fadingGraph.value = null;
    stagger.value = false;
  }, 1200);
}

function algoVertexState(id: string): string {
  const step = props.algorithmStep;
  if (step === null) {
    return "";
  }
  if (step.current === id) {
    return "current";
  }
  if (step.frontier.includes(id)) {
    return "frontier";
  }
  if (step.visited.includes(id)) {
    return "visited";
  }
  return "";
}

function algoVertexLabel(id: string): string {
  if (props.algorithmStep === null) {
    return "";
  }
  const label = props.algorithmStep.labels[id];
  return label === undefined ? "" : label;
}

function algoEdgeState(id: string): string {
  const step = props.algorithmStep;
  if (step === null) {
    return "";
  }
  if (step.activeEdge === id) {
    return "active";
  }
  if (step.treeEdges.includes(id)) {
    return "tree";
  }
  return "";
}

function vertexDelay(index: number): number {
  if (!stagger.value) {
    return 0;
  }
  return Math.min(index * 25, 450);
}

function edgeDelay(index: number): number {
  if (!stagger.value) {
    return 0;
  }
  return 250 + Math.min(index * 15, 400);
}

function morphFrom(before: Graph) {
  const after = props.graph;
  playMotion(550, "", (t) => blendGraph(before, after, easeOutCubic(t)));
}

function playOrbit(centerId: string, leafIds: string[]) {
  const graph = props.graph;
  playMotion(1800, "", (t) => {
    const angle = Math.PI * 2 * easeInOutCubic(t);
    return orbitGraph(graph, centerId, leafIds, angle);
  });
}

function playFall(before: Graph) {
  playMotion(1100, "graph-canvas__svg--falling", (t) => fallGraph(before, t, 700));
}

function addCuts(now: Graph, before: Graph) {
  const added: Cut[] = [];
  for (const edge of before.edges) {
    if (added.length >= MAX_CUTS) {
      break;
    }
    if (edge.source === edge.target) {
      continue;
    }
    let stillThere = false;
    for (const other of now.edges) {
      if (other.id === edge.id) {
        stillThere = true;
      }
    }
    const from = findVertex(before, edge.source);
    const to = findVertex(before, edge.target);
    if (stillThere || from === undefined || to === undefined) {
      continue;
    }
    ghostCount = ghostCount + 1;
    added.push({
      key: ghostCount,
      x1: from.x,
      y1: from.y,
      middleX: (from.x + to.x) / 2,
      middleY: (from.y + to.y) / 2,
      x2: to.x,
      y2: to.y,
    });
  }
  if (added.length === 0) {
    return;
  }
  cuts.value = cuts.value.concat(added);
  const lastKey = ghostCount;
  const timer = window.setTimeout(() => {
    cuts.value = cuts.value.filter((cut) => cut.key > lastKey);
  }, 600);
  ghostTimers.push(timer);
}
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

const emptyText = computed(() => emptyCanvasText(viewOnly.value, props.tool, props.rules.canAdd));

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
    const isJump = jumpFrom !== null && before === jumpFrom;
    jumpFrom = null;
    if (motionTarget !== null && now !== motionTarget) {
      stopMotion();
    }
    if (before === undefined || !motionAllowed()) {
      return;
    }
    const cleared = now.vertices.length === 0 && before.vertices.length >= FALL_MIN_VERTICES;
    if (cleared) {
      playFall(before);
      return;
    }
    if (isJump && !sharesMostVertices(before, now)) {
      crossfadeFrom(before);
      return;
    }
    if (isJump) {
      playMotion(450, "", (t) => blendGraph(before, now, easeOutCubic(t)));
    }
    if (now.vertices.length < before.vertices.length) {
      addGhosts(now, before);
    }
    if (now.edges.length < before.edges.length) {
      addCuts(now, before);
    }
  },
);

onBeforeUnmount(() => {
  for (const timer of ghostTimers) {
    window.clearTimeout(timer);
  }
  window.clearTimeout(fadeTimer);
  stopReels();
  stopMotion();
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
  adjust: (position, group, free) => {
    if (free) {
      guides.value = [];
      return position;
    }
    const snapped = snapToGuides(props.graph, group, position, GUIDE_SNAP);
    guides.value = snapped.guides;
    return snapped.point;
  },
  onEnd: () => {
    guides.value = [];
  },
});

const pan = useCanvasPan({ onPan: panViewport });

const edgeDrag = useEdgeDrag({
  toWorld: toWorld,
  onStart: (sourceId) => {
    closeMenu();
    edgeSourceId.value = sourceId;
  },
  onMove: (point) => {
    aimEdge(point);
  },
  onDrop: (sourceId, point) => {
    if (edgeSourceId.value !== sourceId) {
      return;
    }
    cancelEdge();
    let target = vertexAt(props.graph, point, VERTEX_RADIUS);
    if (target === null) {
      target = snapVertex(props.graph, point, sourceId, SNAP_RADIUS);
    }
    if (target !== null && target.id !== sourceId) {
      edits.connect(sourceId, target.id);
    } else if (target === null && props.rules.canAdd && farEnoughToGrow(sourceId, point)) {
      edits.growFrom(sourceId, limitToView(point));
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

const edgeShapes = computed(() => buildEdgeShapes(shownGraph.value, VERTEX_RADIUS));

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

const growPreview = computed(() => {
  if (!edgeDrag.isDragging.value || !props.rules.canAdd || snapTargetId.value !== null) {
    return false;
  }
  if (edgeSourceId.value === null || cursorPoint.value === null) {
    return false;
  }
  return farEnoughToGrow(edgeSourceId.value, cursorPoint.value);
});

const canvasClasses = computed(() => {
  return [
    viewOnly.value ? "graph-canvas__svg--readonly" : "graph-canvas__svg--tool-" + props.tool,
    {
      "graph-canvas__svg--space": props.panMode,
      "graph-canvas__svg--panning": pan.isPanning.value,
      "graph-canvas__svg--linking": edgeDrag.isDragging.value,
      "graph-canvas__svg--stars": props.mood === "stars",
      "graph-canvas__svg--demon": props.mood === "demon",
      "graph-canvas__svg--jackpot": props.mood === "jackpot",
    },
    motionClass.value,
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
  if (viewOnly.value || !props.rules.canMove) {
    return false;
  }
  return props.tool === "select" || props.tool === "vertex";
});

const ignoresClicks = computed(() => viewOnly.value || props.tool === "pan");

function select(selection: GraphSelection | null) {
  emit("update:selection", selection);
}

function cancelEdge() {
  edgeSourceId.value = null;
  cursorPoint.value = null;
  snapTargetId.value = null;
}

function aimEdge(point: Point) {
  if (edgeSourceId.value === null) {
    cursorPoint.value = point;
    return;
  }
  const target = snapVertex(props.graph, point, edgeSourceId.value, SNAP_RADIUS);
  if (target === null) {
    snapTargetId.value = null;
    cursorPoint.value = point;
  } else {
    snapTargetId.value = target.id;
    cursorPoint.value = { x: target.x, y: target.y };
  }
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
  if (props.rules.canEditLabels && canRename(kind, props.tool, viewOnly.value)) {
    openRename(kind, id);
  }
}

function renameSelected() {
  if (viewOnly.value || !props.rules.canEditLabels) {
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
  if (!viewOnly.value) {
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
  fitTo(props.graph.vertices, true);
}

function fitSelection() {
  const points = focusPoints(props.graph, props.selection);
  if (points.length === 0) {
    fitView();
    return;
  }
  closeMenu();
  fitTo(points, true);
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
  if (viewOnly.value || props.panMode) {
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
  const quiet = viewOnly.value || props.tool === "select" || props.tool === "pan";
  if (event.detail === 3 && quiet) {
    emit("triple-click");
  }
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
    aimEdge(pointerPoint.value);
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
  if (viewOnly.value) {
    openMenu(event, { kind: "view" });
  } else if (isInGroup(kind, id)) {
    openMenu(event, { kind: "group" });
  } else {
    select({ kind: kind, id: id });
    openMenu(event, { kind: kind, id: id });
  }
}

function onBackgroundMenu(event: MouseEvent) {
  if (viewOnly.value) {
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
  const before = props.graph;
  edits.arrange(kind);
  nextTick(() => {
    morphFrom(before);
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
  () => viewOnly.value,
  (isReadonly) => {
    cancelEdge();
    closeMenu();
    cancelRename();
    if (isReadonly && !props.locked) {
      fitView();
    }
  },
);

onMounted(() => {
  if (props.readonly) {
    fitTo(props.graph.vertices, false);
  }
});

function copy(): GraphClipboard | null {
  return copySelection(props.graph, props.selection);
}

function pointerPosition(): Point | null {
  return pointerPoint.value;
}

function paste(clipboard: GraphClipboard, shift: Point) {
  if (viewOnly.value) {
    return;
  }
  cancelEdge();
  closeMenu();
  edits.paste(clipboard, shift);
}

function moveSelected(dx: number, dy: number, record: boolean) {
  if (viewOnly.value) {
    return;
  }
  closeMenu();
  edits.moveSelected(dx, dy, record);
}

defineExpose({
  playOrbit: playOrbit,
  fitSelection: fitSelection,
  expectJump: expectJump,
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
      <rect class="graph-canvas__sky" width="100%" height="100%" />
      <rect class="graph-canvas__grid" width="100%" height="100%" :fill="'url(#' + gridId + ')'" />
      <svg v-if="skyStars.length > 0" class="graph-canvas__sky-stars" width="100%" height="100%">
        <circle
          v-for="star in skyStars"
          :key="star.key"
          :cx="star.x"
          :cy="star.y"
          :r="star.size"
          :style="{ animationDelay: star.delay }"
        />
      </svg>

      <g :transform="transform">
        <line
          v-if="edgeSource && cursorPoint"
          :x1="edgeSource.x"
          :y1="edgeSource.y"
          :x2="cursorPoint.x"
          :y2="cursorPoint.y"
          class="graph-canvas__preview"
        />
        <circle
          v-if="growPreview && cursorPoint"
          :cx="cursorPoint.x"
          :cy="cursorPoint.y"
          :r="VERTEX_RADIUS"
          class="graph-canvas__grow"
        />

        <g v-if="fadingGraph !== null" :key="'fade-' + fadingKey" class="graph-canvas__fading">
          <GraphEdgeItem
            v-for="shape in fadingShapes"
            :key="shape.id"
            :shape="shape"
            :selected="false"
            :directed="fadingGraph.isDirected"
          />
          <GraphVertexItem
            v-for="vertex in fadingGraph.vertices"
            :key="vertex.id"
            :vertex="vertex"
            :selected="false"
            :highlighted="false"
            :dragged="false"
            :draggable="false"
          />
        </g>

        <GraphEdgeItem
          v-for="(shape, index) in edgeShapes"
          :key="shape.id"
          :appear-delay="edgeDelay(index)"
          :algo-state="algoEdgeState(shape.id)"
          :component="componentOfEdge(shape.id)"
          :shape="shape"
          :selected="isSelected(selection, 'edge', shape.id)"
          :directed="graph.isDirected"
          :title="edgeTitle(shape.id)"
          :lit="lit.edgeIds.includes(shape.id)"
          @pick="onEdgeClick($event, shape.id)"
          @rename="startRename('edge', shape.id)"
          @menu="onItemMenu($event, 'edge', shape.id)"
        />

        <path
          v-if="comet !== null && cometPath !== ''"
          :key="'trail-' + comet.key"
          :d="cometPath"
          pathLength="1"
          class="graph-canvas__comet-trail"
          :style="{ animationDuration: comet.duration + 'ms' }"
        />
        <path
          v-if="comet !== null && cometPath !== ''"
          :key="'head-' + comet.key"
          :d="cometPath"
          pathLength="1"
          class="graph-canvas__comet-head"
          :style="{ animationDuration: comet.duration + 'ms' }"
        />

        <g v-for="cut in cuts" :key="'cut-' + cut.key" class="graph-canvas__cut">
          <line
            class="graph-canvas__cut-half graph-canvas__cut-half--first"
            :x1="cut.x1"
            :y1="cut.y1"
            :x2="cut.middleX"
            :y2="cut.middleY"
          />
          <line
            class="graph-canvas__cut-half graph-canvas__cut-half--second"
            :x1="cut.middleX"
            :y1="cut.middleY"
            :x2="cut.x2"
            :y2="cut.y2"
          />
        </g>

        <GraphVertexItem
          v-for="(vertex, index) in shownGraph.vertices"
          :key="vertex.id"
          :appear-delay="vertexDelay(index)"
          :algo-state="algoVertexState(vertex.id)"
          :algo-label="algoVertexLabel(vertex.id)"
          :label-override="labelOverrideOf(index)"
          :component="componentOfVertex(vertex.id)"
          :component-delay="componentDelay(vertex.id)"
          :vertex="vertex"
          :selected="isSelected(selection, 'vertex', vertex.id)"
          :highlighted="vertex.id === edgeSourceId"
          :dragged="vertex.id === draggedVertexId"
          :draggable="verticesDraggable"
          :degree="degreeOfVertex(vertex.id)"
          :wave-step="waveStepOf(vertex.id)"
          :wave-key="wave === null ? 0 : wave.key"
          :lit="lit.vertexIds.includes(vertex.id)"
          :snapped="vertex.id === snapTargetId"
          :glow="glowIds.includes(vertex.id)"
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

        <line
          v-for="guide in guides"
          :key="(guide.vertical ? 'v' : 'h') + guide.position"
          class="graph-canvas__guide"
          :x1="guide.vertical ? guide.position : guide.from"
          :y1="guide.vertical ? guide.from : guide.position"
          :x2="guide.vertical ? guide.position : guide.to"
          :y2="guide.vertical ? guide.to : guide.position"
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

    <div v-if="coins.length > 0" class="graph-canvas__coins" aria-hidden="true">
      <span
        v-for="coin in coins"
        :key="coin.key"
        class="graph-canvas__coin"
        :style="{ left: coin.x, animationDelay: coin.delay, animationDuration: coin.duration }"
      />
    </div>

    <Transition name="graph-canvas-empty">
      <div v-if="shownGraph.vertices.length === 0" class="graph-canvas__empty">
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

.graph-canvas__grid,
.graph-canvas__sky,
.graph-canvas__sky-stars,
.graph-canvas__cut,
.graph-canvas__comet-trail,
.graph-canvas__comet-head {
  pointer-events: none;
}

.graph-canvas__sky {
  fill: #050b22;
  opacity: 0;
  transition:
    opacity 700ms var(--ease-out),
    fill 400ms var(--ease-out);
}

.graph-canvas__svg--stars .graph-canvas__sky {
  opacity: 1;
}

.graph-canvas__svg--demon .graph-canvas__sky {
  fill: #2a0307;
  opacity: 0.94;
  animation: graph-canvas-flicker 900ms steps(2) infinite;
}

.graph-canvas__sky-stars circle {
  fill: #ffffff;
  animation: graph-canvas-twinkle 2.4s ease-in-out infinite;
}

.graph-canvas__svg--stars .graph-canvas__dot {
  fill: #ffffff;
  opacity: 0.12;
}

.graph-canvas__svg--stars :deep(.graph-vertex__body) {
  transform: scale(0.4);
  transition: transform 700ms var(--ease-out);
}

.graph-canvas__svg--stars :deep(.graph-vertex__body circle) {
  fill: #ffffff;
  stroke: #cfe3ff;
  filter: drop-shadow(0 0 6px #9fd0ff);
  animation: graph-canvas-twinkle 1.8s ease-in-out infinite;
}

.graph-canvas__svg--stars :deep(.graph-vertex:nth-child(3n) .graph-vertex__body circle) {
  animation-delay: 0.6s;
}

.graph-canvas__svg--stars :deep(.graph-vertex:nth-child(3n + 1) .graph-vertex__body circle) {
  animation-delay: 1.2s;
}

.graph-canvas__svg--stars :deep(.graph-vertex__label),
.graph-canvas__svg--stars :deep(.graph-vertex__weight),
.graph-canvas__svg--stars :deep(.graph-edge__text),
.graph-canvas__svg--stars :deep(.graph-vertex__halo) {
  opacity: 0;
}

.graph-canvas__svg--stars :deep(.graph-edge__line) {
  stroke: #cfe3ff;
  stroke-opacity: 0.35;
  stroke-width: 1;
}

.graph-canvas__svg--demon {
  animation: graph-canvas-shake 450ms linear 3;
}

.graph-canvas__svg--demon :deep(.graph-vertex__body circle) {
  fill: #3a0508;
  stroke: #ff2a2a;
  filter: drop-shadow(0 0 8px #ff1f1f);
}

.graph-canvas__svg--demon :deep(.graph-vertex__label) {
  fill: #ff6b6b;
}

.graph-canvas__svg--demon :deep(.graph-edge__line) {
  stroke: #ff2a2a;
  animation: graph-canvas-flicker 600ms steps(2) infinite;
}

.graph-canvas__svg--demon .graph-canvas__dot {
  fill: #ff2a2a;
  opacity: 0.3;
}

.graph-canvas__svg--jackpot .graph-canvas__sky {
  fill: #2b1a00;
  opacity: 0.55;
}

.graph-canvas__svg--jackpot :deep(.graph-vertex__body circle) {
  fill: #ffd54a;
  stroke: #e0a100;
  stroke-width: 3;
  filter: drop-shadow(0 0 8px #ffcc33);
}

.graph-canvas__svg--jackpot :deep(.graph-vertex__label) {
  fill: #3a2600;
  font-weight: 800;
}

.graph-canvas__svg--jackpot :deep(.graph-edge__line) {
  stroke: #f2b705;
}

.graph-canvas__coins {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.graph-canvas__coin {
  position: absolute;
  top: -24px;
  width: 16px;
  height: 16px;
  border: 2px solid #c98a00;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff3b0, #ffcc33 55%, #e0a100);
  animation-name: graph-canvas-coin;
  animation-timing-function: ease-in;
  animation-fill-mode: both;
}

@keyframes graph-canvas-coin {
  from {
    transform: translateY(0) rotateY(0deg);
  }
  to {
    transform: translateY(110vh) rotateY(720deg);
  }
}

.graph-canvas__svg--falling :deep(.graph-vertex),
.graph-canvas__svg--falling :deep(.graph-edge) {
  animation: graph-canvas-fade-out 1100ms ease-in both;
}

.graph-canvas__cut-half {
  stroke: var(--graph-edge);
  stroke-width: 2;
  stroke-linecap: round;
  transform-box: fill-box;
  animation: graph-canvas-cut 550ms ease-in both;
}

.graph-canvas__cut-half--first {
  --cut-turn: -14deg;
  --cut-shift: -8px;
  transform-origin: left center;
}

.graph-canvas__cut-half--second {
  --cut-turn: 14deg;
  --cut-shift: 8px;
  transform-origin: right center;
}

.graph-canvas__comet-trail {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  opacity: 0.45;
  animation-name: graph-canvas-comet-trail;
  animation-timing-function: linear;
  animation-fill-mode: both;
}

.graph-canvas__comet-head {
  fill: none;
  stroke: var(--color-on-accent);
  stroke-width: 7;
  stroke-linecap: round;
  stroke-dasharray: 0.035 2;
  filter: drop-shadow(0 0 6px var(--color-accent)) drop-shadow(0 0 12px var(--color-accent));
  animation-name: graph-canvas-comet-head;
  animation-timing-function: linear;
  animation-fill-mode: both;
}

.graph-canvas__dot {
  fill: var(--graph-edge);
  opacity: 0.25;
}

.graph-canvas__fading {
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-canvas-fade-away 420ms ease-in both;
}

.graph-canvas__fading :deep(.graph-vertex),
.graph-canvas__fading :deep(.graph-edge__line) {
  animation: none;
}

@keyframes graph-canvas-fade-away {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: scale(0.94);
  }
}

.graph-canvas__grow {
  fill: var(--color-accent-muted);
  fill-opacity: 0.6;
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 5 4;
  pointer-events: none;
  animation:
    graph-canvas-ants-line 500ms linear infinite,
    graph-canvas-grow-in 200ms var(--ease-out);
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes graph-canvas-grow-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
}

.graph-canvas__guide {
  stroke: #ff4f9a;
  stroke-width: 1;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
  animation: graph-canvas-guide-in 160ms var(--ease-out);
}

@keyframes graph-canvas-guide-in {
  from {
    opacity: 0;
  }
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
  stroke-dashoffset: 0;
  opacity: 0.7;
  animation: graph-canvas-empty-edge 6s var(--ease-out) infinite backwards;
  animation-delay: calc(1.3s + var(--i) * 0.3s);
}

.graph-canvas__empty-node {
  fill: var(--graph-vertex-fill);
  stroke: var(--color-accent);
  stroke-width: 2.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-canvas-empty-node 6s var(--ease-spring) infinite backwards;
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

@keyframes graph-canvas-twinkle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes graph-canvas-flicker {
  0% {
    opacity: 0.94;
  }
  50% {
    opacity: 0.78;
  }
}

@keyframes graph-canvas-shake {
  0%,
  100% {
    transform: none;
  }
  20% {
    transform: translate(-4px, 2px) rotate(-0.4deg);
  }
  40% {
    transform: translate(4px, -2px) rotate(0.4deg);
  }
  60% {
    transform: translate(-3px, -1px);
  }
  80% {
    transform: translate(3px, 1px);
  }
}

@keyframes graph-canvas-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes graph-canvas-cut {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: translate(var(--cut-shift), 26px) rotate(var(--cut-turn));
  }
}

@keyframes graph-canvas-comet-trail {
  0% {
    stroke-dashoffset: 1;
    opacity: 0.45;
  }
  85% {
    stroke-dashoffset: 0;
    opacity: 0.45;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

@keyframes graph-canvas-comet-head {
  0% {
    stroke-dashoffset: 0.035;
    opacity: 1;
  }
  85% {
    stroke-dashoffset: -1;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -1;
    opacity: 0;
  }
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
