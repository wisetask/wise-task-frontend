<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Graph } from "@/entities/graph";
import { useGraphHistory } from "@/features/graph-history";
import { motionAllowed } from "@/shared/lib/motion";
import {
  CELEBRATION_TEXTS,
  cometDuration,
  cometPoints,
  createCodeWatcher,
  DEMON_CODE,
  discoverShapes,
  JACKPOT_CODE,
  KONAMI_CODE,
  waveSteps,
  type CanvasMood,
  type CelebrationKind,
  type Comet,
  type ShapeKind,
  type VertexWave,
} from "../lib/celebrations";
import { runAlgorithm, type AlgorithmKind, type AlgorithmRun } from "../lib/algorithms";
import { pasteShift, type GraphClipboard } from "../lib/clipboard";
import type { Point } from "../lib/geometry";
import {
  DEFAULT_HOTKEYS,
  moveFromAction,
  toolFromAction,
  withHotkey,
  type HotkeyAction,
} from "../lib/hotkeys";
import { isTyping } from "../lib/pointer";
import { allowEverything, canRunHotkey, canUseTool, type EditorRules } from "../lib/rules";
import { isSelectionValid, type EditorTool, type GraphSelection } from "../lib/selection";
import { useEditorKeys } from "../lib/useEditorKeys";
import GraphAlgorithmPlayer from "./GraphAlgorithmPlayer.vue";
import GraphCanvas from "./GraphCanvas.vue";
import GraphHotkeysHelp from "./GraphHotkeysHelp.vue";
import GraphPropertiesPanel from "./GraphPropertiesPanel.vue";
import GraphStatsBar from "./GraphStatsBar.vue";
import GraphToolbar from "./GraphToolbar.vue";

const props = withDefaults(
  defineProps<{
    readonly?: boolean;
    rules?: EditorRules;
    analysis?: boolean;
  }>(),
  {
    readonly: false,
    rules: () => allowEverything(),
    analysis: false,
  },
);

const graph = defineModel<Graph>("graph", { required: true });
const tool = defineModel<EditorTool>("tool", { default: "vertex" });

const selection = ref<GraphSelection | null>(null);
const panelOpen = ref(true);
const helpOpen = ref(false);
const showDegrees = ref(false);
const wave = ref<VertexWave | null>(null);
const celebration = ref<CelebrationKind | null>(null);
const algorithm = ref<AlgorithmRun | null>(null);
const algorithmIndex = ref(0);
const algorithmPlaying = ref(false);
const algorithmSpeed = ref("1");
let algorithmTimer = 0;
const STEP_TIME = 1300;

const running = computed(() => algorithm.value !== null);

const algorithmStep = computed(() => {
  if (algorithm.value === null || algorithm.value.steps.length === 0) {
    return null;
  }
  return algorithm.value.steps[algorithmIndex.value];
});

const mood = ref<CanvasMood>("");
const comet = ref<Comet | null>(null);
const glowIds = ref<string[]>([]);
const celebrated: ShapeKind[] = [];
const konami = createCodeWatcher(KONAMI_CODE);
const demon = createCodeWatcher(DEMON_CODE);
const jackpot = createCodeWatcher(JACKPOT_CODE);
let celebrationTimer = 0;
let effectTimer = 0;
let waveCount = 0;
let cometCount = 0;
const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315];

const undoTitle = withHotkey("Отменить", "undo", DEFAULT_HOTKEYS);
const redoTitle = withHotkey("Повторить", "redo", DEFAULT_HOTKEYS);
const clipboard = ref<GraphClipboard | null>(null);
const hasPasted = ref(false);
const pasteRepeat = ref(0);
const lastPastePointer = ref<Point | null>(null);

function samePlace(first: Point | null, second: Point | null): boolean {
  if (first === null || second === null) {
    return first === second;
  }
  return first.x === second.x && first.y === second.y;
}
const canvas = ref<InstanceType<typeof GraphCanvas> | null>(null);
const history = useGraphHistory(graph);
const canUndo = history.canUndo;
const canRedo = history.canRedo;

const { isSpaceHeld } = useEditorKeys({
  isEnabled: () => !props.readonly && algorithm.value === null,
  onAction: runHotkey,
});

function forgetMissingSelection() {
  if (selection.value !== null && !isSelectionValid(graph.value, selection.value)) {
    selection.value = null;
  }
}

function onBeforeChange(snapshot: Graph) {
  history.record(snapshot);
}

function prepareJump() {
  if (canvas.value !== null) {
    canvas.value.expectJump(graph.value);
  }
}

function undo() {
  if (!canUndo.value) {
    return;
  }
  prepareJump();
  history.undo();
}

function redo() {
  if (!canRedo.value) {
    return;
  }
  prepareJump();
  history.redo();
}

function replaceGraph(newGraph: Graph) {
  if (newGraph === graph.value) {
    return;
  }
  history.record(graph.value);
  prepareJump();
  graph.value = newGraph;
}

function startOver(newGraph: Graph) {
  if (newGraph !== graph.value) {
    prepareJump();
  }
  graph.value = newGraph;
  selection.value = null;
  history.clear();
}

function runHotkey(action: HotkeyAction, isRepeat: boolean) {
  if (helpOpen.value) {
    if (action === "help" || action === "cancel") {
      helpOpen.value = false;
    }
    return;
  }
  if (action === "help") {
    helpOpen.value = true;
    return;
  }
  if (!canRunHotkey(action, props.rules)) {
    return;
  }
  const newTool = toolFromAction(action);
  if (newTool !== null) {
    tool.value = newTool;
    return;
  }
  if (action === "undo") {
    if (canUndo.value) {
      undo();
    }
    return;
  }
  if (action === "redo") {
    if (canRedo.value) {
      redo();
    }
    return;
  }
  if (canvas.value === null) {
    return;
  }
  const move = moveFromAction(action);
  if (move !== null) {
    canvas.value.moveSelected(move.x, move.y, !isRepeat);
    return;
  }
  if (action === "zoom-in") {
    canvas.value.zoomIn();
  } else if (action === "zoom-out") {
    canvas.value.zoomOut();
  } else if (action === "zoom-reset") {
    canvas.value.resetZoom();
  } else if (action === "zoom-fit") {
    canvas.value.fitView();
  } else if (action === "select-all") {
    canvas.value.selectAll();
  } else if (action === "copy" || action === "cut") {
    const copied = canvas.value.copy();
    if (copied === null) {
      return;
    }
    clipboard.value = copied;
    hasPasted.value = false;
    if (action === "cut") {
      canvas.value.deleteSelected();
    }
  } else if (action === "paste") {
    if (clipboard.value !== null) {
      const pointer = canvas.value.pointerPosition();
      if (hasPasted.value && samePlace(pointer, lastPastePointer.value)) {
        pasteRepeat.value = pasteRepeat.value + 1;
      } else {
        pasteRepeat.value = 0;
      }
      hasPasted.value = true;
      lastPastePointer.value = pointer;
      canvas.value.paste(clipboard.value, pasteShift(clipboard.value, pointer, pasteRepeat.value));
    }
  } else if (action === "duplicate") {
    const copied = canvas.value.copy();
    if (copied !== null) {
      canvas.value.paste(copied, pasteShift(copied, null, 0));
    }
  } else if (action === "rename") {
    canvas.value.renameSelected();
  } else if (action === "delete") {
    canvas.value.deleteSelected();
  } else if (action === "cancel") {
    canvas.value.cancel();
  }
}

watch(graph, forgetMissingSelection);

function stopPlaying() {
  algorithmPlaying.value = false;
  window.clearInterval(algorithmTimer);
  algorithmTimer = 0;
}

function lastAlgorithmIndex(): number {
  if (algorithm.value === null) {
    return 0;
  }
  return algorithm.value.steps.length - 1;
}

function nextAlgorithmStep() {
  if (algorithmIndex.value < lastAlgorithmIndex()) {
    algorithmIndex.value = algorithmIndex.value + 1;
  }
  if (algorithmIndex.value >= lastAlgorithmIndex()) {
    stopPlaying();
  }
}

function startPlaying() {
  stopPlaying();
  if (algorithm.value === null || algorithm.value.steps.length === 0) {
    return;
  }
  if (algorithmIndex.value >= lastAlgorithmIndex()) {
    algorithmIndex.value = 0;
  }
  algorithmPlaying.value = true;
  const delay = STEP_TIME / Number(algorithmSpeed.value);
  algorithmTimer = window.setInterval(nextAlgorithmStep, delay);
}

function toggleAlgorithm() {
  if (algorithmPlaying.value) {
    stopPlaying();
  } else {
    startPlaying();
  }
}

function showAlgorithmStep(index: number) {
  stopPlaying();
  algorithmIndex.value = index;
}

function changeSpeed(speed: string) {
  algorithmSpeed.value = speed;
  if (algorithmPlaying.value) {
    startPlaying();
  }
}

function startAlgorithm(kind: AlgorithmKind) {
  if (selection.value === null || selection.value.kind !== "vertex") {
    return;
  }
  const run = runAlgorithm(kind, graph.value, selection.value.id);
  selection.value = null;
  algorithm.value = run;
  algorithmIndex.value = 0;
  startPlaying();
}

function closeAlgorithm() {
  stopPlaying();
  algorithm.value = null;
}

watch(graph, () => {
  if (algorithm.value !== null) {
    closeAlgorithm();
  }
});

function onPlayerKey(event: KeyboardEvent) {
  if (algorithm.value === null || isTyping(event)) {
    return;
  }
  const last = lastAlgorithmIndex();
  if (event.code === "Escape") {
    closeAlgorithm();
  } else if (event.code === "Space") {
    toggleAlgorithm();
  } else if (event.code === "ArrowRight" && algorithmIndex.value < last) {
    showAlgorithmStep(algorithmIndex.value + 1);
  } else if (event.code === "ArrowLeft" && algorithmIndex.value > 0) {
    showAlgorithmStep(algorithmIndex.value - 1);
  } else if (event.code === "Home") {
    showAlgorithmStep(0);
  } else if (event.code === "End") {
    showAlgorithmStep(last);
  } else {
    return;
  }
  event.preventDefault();
}

function showToast(kind: CelebrationKind) {
  celebration.value = kind;
  window.clearTimeout(celebrationTimer);
  celebrationTimer = window.setTimeout(() => {
    celebration.value = null;
  }, 4500);
}

function clearEffects() {
  mood.value = "";
  comet.value = null;
  glowIds.value = [];
}

function clearEffectsAfter(duration: number) {
  window.clearTimeout(effectTimer);
  effectTimer = window.setTimeout(clearEffects, duration);
}

function startWave(steps: Record<string, number>) {
  waveCount = waveCount + 1;
  wave.value = { key: waveCount, steps: steps };
}

function celebrate(kind: CelebrationKind, vertexIds: string[]) {
  showToast(kind);
  if (!motionAllowed()) {
    return;
  }
  clearEffects();
  if (kind === "demon") {
    mood.value = "demon";
    clearEffectsAfter(3500);
  } else if (kind === "stars") {
    mood.value = "stars";
    clearEffectsAfter(6500);
  } else if (kind === "jackpot") {
    mood.value = "jackpot";
    clearEffectsAfter(4200);
  } else if (kind === "euler") {
    const points = cometPoints(graph.value, vertexIds);
    const duration = cometDuration(points.length);
    cometCount = cometCount + 1;
    comet.value = { key: cometCount, points: points, duration: duration };
    clearEffectsAfter(duration + 400);
  } else if (kind === "star") {
    if (canvas.value !== null) {
      canvas.value.playOrbit(vertexIds[0], vertexIds.slice(1));
    }
  } else if (kind === "graf") {
    const steps: Record<string, number> = {};
    for (let i = 0; i < vertexIds.length; i++) {
      steps[vertexIds[i]] = i * 2;
    }
    startWave(steps);
  } else if (kind === "konigsberg") {
    glowIds.value = vertexIds;
    clearEffectsAfter(3500);
    startWave(waveSteps(graph.value));
  } else {
    startWave(waveSteps(graph.value));
  }
}

watch(graph, () => {
  if (!props.analysis || props.readonly) {
    return;
  }
  for (const found of discoverShapes(graph.value)) {
    if (!celebrated.includes(found.kind)) {
      celebrated.push(found.kind);
      celebrate(found.kind, found.vertexIds);
      return;
    }
  }
});

function onSecretKey(event: KeyboardEvent) {
  if (isTyping(event)) {
    return;
  }
  if (konami.push(event.code) && graph.value.vertices.length > 0) {
    celebrate("konami", []);
  }
  if (demon.push(event.key)) {
    celebrate("demon", []);
  }
  if (jackpot.push(event.key) && graph.value.vertices.length > 0) {
    celebrate("jackpot", []);
  }
}

function sparkStyle(angle: number) {
  return { "--spark-angle": angle + "deg" };
}

onMounted(() => {
  window.addEventListener("keydown", onSecretKey);
  window.addEventListener("keydown", onPlayerKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onSecretKey);
  window.removeEventListener("keydown", onPlayerKey);
  stopPlaying();
  window.clearTimeout(celebrationTimer);
  window.clearTimeout(effectTimer);
});

watch(
  () => canUseTool(tool.value, props.rules),
  (isAllowed) => {
    if (!isAllowed) {
      tool.value = "select";
    }
  },
  { immediate: true },
);

watch(
  () => props.readonly,
  () => {
    selection.value = null;
    helpOpen.value = false;
  },
);

function fitView() {
  if (canvas.value !== null) {
    canvas.value.fitView();
  }
}

defineExpose({
  replaceGraph: replaceGraph,
  startOver: startOver,
  fitView: fitView,
});
</script>

<template>
  <div class="graph-editor" :class="{ 'graph-editor--readonly': readonly }">
    <div class="graph-editor__stage">
      <div class="graph-editor__canvas">
        <GraphCanvas
          ref="canvas"
          v-model:graph="graph"
          v-model:selection="selection"
          :tool="tool"
          :readonly="readonly"
          :locked="running"
          :pan-mode="isSpaceHeld"
          :rules="rules"
          :show-degrees="analysis && showDegrees"
          :wave="wave"
          :mood="mood"
          :comet="comet"
          :glow-ids="glowIds"
          :algorithm-step="algorithmStep"
          @before-change="onBeforeChange"
          @triple-click="celebrate('stars', [])"
        />
      </div>

      <GraphToolbar
        v-if="!readonly && !running"
        v-model:tool="tool"
        class="graph-editor__toolbar"
        :rules="rules"
        @help="helpOpen = true"
      />

      <div v-if="!running && (!readonly || $slots.tools)" class="graph-editor__topbar">
        <div v-if="!readonly" class="graph-editor__group">
          <button
            type="button"
            class="graph-editor__icon-button"
            :title="undoTitle"
            :aria-label="undoTitle"
            :disabled="!canUndo"
            @click="undo"
          >
            <svg class="graph-editor__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 14 L4 9 L9 4" />
              <path d="M4 9 H14 A6 6 0 0 1 14 21 H10" />
            </svg>
          </button>
          <button
            type="button"
            class="graph-editor__icon-button"
            :title="redoTitle"
            :aria-label="redoTitle"
            :disabled="!canRedo"
            @click="redo"
          >
            <svg class="graph-editor__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 14 L20 9 L15 4" />
              <path d="M20 9 H10 A6 6 0 0 0 10 21 H14" />
            </svg>
          </button>
        </div>
        <div v-if="$slots.tools" class="graph-editor__tools">
          <slot name="tools" />
        </div>
      </div>

      <GraphStatsBar v-if="!running" :graph="graph" class="graph-editor__stats" />

      <Transition name="graph-editor-player">
        <GraphAlgorithmPlayer
          v-if="algorithm !== null"
          class="graph-editor__player"
          :run="algorithm"
          :index="algorithmIndex"
          :playing="algorithmPlaying"
          :speed="algorithmSpeed"
          @step="showAlgorithmStep"
          @toggle="toggleAlgorithm"
          @close="closeAlgorithm"
          @update:speed="changeSpeed"
        />
      </Transition>

      <Transition name="graph-editor-toast">
        <div
          v-if="celebration !== null"
          :key="celebration"
          class="graph-editor__toast"
          :class="'graph-editor__toast--' + celebration"
          role="status"
        >
          <span class="graph-editor__burst" aria-hidden="true">
            <span
              v-for="angle in SPARKS"
              :key="angle"
              class="graph-editor__spark"
              :style="sparkStyle(angle)"
            />
            <svg class="graph-editor__burst-icon" viewBox="0 0 24 24">
              <path d="M12 5 L5 18 M12 5 L19 18 M5 18 L19 18" />
              <circle cx="12" cy="5" r="2.6" />
              <circle cx="5" cy="18" r="2.6" />
              <circle cx="19" cy="18" r="2.6" />
            </svg>
          </span>
          {{ CELEBRATION_TEXTS[celebration] }}
        </div>
      </Transition>

      <div v-if="$slots.actions" class="graph-editor__actions">
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="!readonly"
      class="graph-editor__side"
      :class="{ 'graph-editor__side--collapsed': !panelOpen }"
    >
      <button
        type="button"
        class="graph-editor__collapse"
        :title="panelOpen ? 'Свернуть панель свойств' : 'Показать панель свойств'"
        :aria-expanded="panelOpen"
        @click="panelOpen = !panelOpen"
      >
        <svg class="graph-editor__collapse-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6 L15 12 L9 18" />
        </svg>
      </button>
      <Transition name="graph-editor-panel">
        <GraphPropertiesPanel
          v-if="panelOpen"
          v-model:graph="graph"
          v-model:selection="selection"
          v-model:show-degrees="showDegrees"
          class="graph-editor__properties"
          :rules="rules"
          :analysis="analysis"
          @run-algorithm="startAlgorithm"
          @before-change="onBeforeChange"
          @help="helpOpen = true"
        />
      </Transition>
    </div>
    <GraphHotkeysHelp v-if="helpOpen" @close="helpOpen = false" />
  </div>
</template>

<style scoped>
.graph-editor {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--graph-canvas-bg);
}

.graph-editor__stage {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.graph-editor__canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.graph-editor__toolbar {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 5;
  animation: graph-editor-in 360ms var(--ease-out) both;
}

.graph-editor__topbar {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 5;
  display: flex;
  gap: var(--space-2);
  animation: graph-editor-in 360ms var(--ease-out) 60ms both;
}

.graph-editor__tools {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.graph-editor__group {
  display: flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.graph-editor__icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.graph-editor__icon-button:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.graph-editor__icon-button:hover:not(:disabled) .graph-editor__icon {
  transform: rotate(-12deg);
}

.graph-editor__icon-button + .graph-editor__icon-button:hover:not(:disabled) .graph-editor__icon {
  transform: rotate(12deg);
}

.graph-editor__icon-button:active:not(:disabled) {
  transform: scale(0.9);
}

.graph-editor__icon-button:disabled {
  color: var(--color-text-muted);
  opacity: 0.4;
  cursor: not-allowed;
}

.graph-editor__icon-button:focus-visible,
.graph-editor__collapse:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-editor__icon {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.graph-editor__stats {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  z-index: 5;
  max-width: calc(100% - 420px);
  transform: translateX(-50%);
}

.graph-editor__toast {
  position: absolute;
  top: var(--space-4);
  left: 50%;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: calc(100% - 260px);
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2);
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-accent);
  font-weight: 600;
  transform: translateX(-50%);
}

.graph-editor__burst {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-accent-muted);
}

.graph-editor__burst-icon {
  width: 22px;
  height: 22px;
  fill: var(--color-accent);
  stroke: var(--color-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  animation: graph-editor-spin 900ms var(--ease-spring) both;
}

.graph-editor__spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: graph-editor-spark 800ms var(--ease-out) 120ms both;
}

.graph-editor__spark:nth-child(even) {
  background: var(--color-success);
}

.graph-editor__toast--demon {
  border-color: #ff2a2a;
  box-shadow: 0 8px 24px rgb(255 42 42 / 35%);
}

.graph-editor__toast--demon .graph-editor__burst {
  background: #3a0508;
}

.graph-editor__toast--demon .graph-editor__burst-icon,
.graph-editor__toast--demon .graph-editor__spark {
  fill: #ff2a2a;
  stroke: #ff2a2a;
  background: #ff2a2a;
}

.graph-editor__toast--jackpot {
  border-color: #e0a100;
  box-shadow: 0 8px 24px rgb(255 204 51 / 40%);
}

.graph-editor__toast--jackpot .graph-editor__burst {
  background: #fff3b0;
}

.graph-editor__toast--jackpot .graph-editor__burst-icon {
  fill: #e0a100;
  stroke: #e0a100;
}

.graph-editor__toast--jackpot .graph-editor__spark {
  background: #ffcc33;
}

.graph-editor__toast--stars .graph-editor__spark {
  background: #ffffff;
}

.graph-editor-toast-enter-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.graph-editor-toast-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.graph-editor-toast-enter-from,
.graph-editor-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px) scale(0.9);
}

@keyframes graph-editor-spin {
  from {
    transform: rotate(-120deg) scale(0.4);
  }
  to {
    transform: none;
  }
}

@keyframes graph-editor-spark {
  0% {
    opacity: 1;
    transform: rotate(var(--spark-angle)) translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotate(var(--spark-angle)) translateX(26px) scale(0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-editor__burst-icon,
  .graph-editor__spark {
    animation: none;
  }

  .graph-editor__spark {
    display: none;
  }
}

.graph-editor__player {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  z-index: 7;
  transform: translateX(-50%);
}

.graph-editor-player-enter-active,
.graph-editor-player-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.graph-editor-player-enter-from,
.graph-editor-player-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}

.graph-editor__actions {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 5;
  display: flex;
  gap: var(--space-2);
}

.graph-editor__side {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 290px;
  min-height: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: width var(--duration) var(--ease-out);
}

.graph-editor__side--collapsed {
  width: 52px;
}

.graph-editor__collapse {
  position: absolute;
  top: var(--space-4);
  right: 10px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.graph-editor__collapse:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.graph-editor__collapse-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.graph-editor__side--collapsed .graph-editor__collapse-icon {
  transform: rotate(180deg);
}

.graph-editor__properties {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.graph-editor-panel-enter-active,
.graph-editor-panel-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.graph-editor-panel-enter-from,
.graph-editor-panel-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

@keyframes graph-editor-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
