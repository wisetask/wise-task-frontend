<script setup lang="ts">
import { ref, watch } from "vue";
import type { Graph } from "@/entities/graph";
import { useGraphHistory } from "@/features/graph-history";
import { pasteShift, type GraphClipboard } from "../lib/clipboard";
import type { Point } from "../lib/geometry";
import { toolFromAction, type HotkeyAction } from "../lib/hotkeys";
import { isSelectionValid, type EditorTool, type GraphSelection } from "../lib/selection";
import { useEditorKeys } from "../lib/useEditorKeys";
import GraphCanvas from "./GraphCanvas.vue";
import GraphPropertiesPanel from "./GraphPropertiesPanel.vue";
import GraphStatsBar from "./GraphStatsBar.vue";
import GraphToolbar from "./GraphToolbar.vue";

const props = withDefaults(
  defineProps<{
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  },
);

const graph = defineModel<Graph>("graph", { required: true });
const tool = defineModel<EditorTool>("tool", { default: "vertex" });

const selection = ref<GraphSelection | null>(null);
const panelOpen = ref(true);
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
  isEnabled: () => !props.readonly,
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

function undo() {
  history.undo();
}

function redo() {
  history.redo();
}

function replaceGraph(newGraph: Graph) {
  if (newGraph === graph.value) {
    return;
  }
  history.record(graph.value);
  graph.value = newGraph;
}

function startOver(newGraph: Graph) {
  graph.value = newGraph;
  selection.value = null;
  history.clear();
}

function runHotkey(action: HotkeyAction) {
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
  } else if (action === "delete") {
    canvas.value.deleteSelected();
  } else if (action === "cancel") {
    canvas.value.cancel();
  }
}

watch(graph, forgetMissingSelection);

watch(
  () => props.readonly,
  () => {
    selection.value = null;
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
    <GraphToolbar
      v-if="!readonly"
      v-model:tool="tool"
      class="graph-editor__toolbar"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undo"
      @redo="redo"
    />
    <div class="graph-editor__center">
      <div class="graph-editor__canvas">
        <GraphCanvas
          ref="canvas"
          v-model:graph="graph"
          v-model:selection="selection"
          :tool="tool"
          :readonly="readonly"
          :pan-mode="isSpaceHeld"
          @before-change="onBeforeChange"
        />
      </div>
      <GraphStatsBar :graph="graph" />
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
        {{ panelOpen ? "›" : "‹" }}
      </button>
      <GraphPropertiesPanel
        v-if="panelOpen"
        v-model:graph="graph"
        v-model:selection="selection"
        class="graph-editor__properties"
        @before-change="onBeforeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.graph-editor {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 100%;
  min-height: 0;
}

.graph-editor--readonly {
  grid-template-columns: 1fr;
}

.graph-editor__toolbar {
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.graph-editor__center {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.graph-editor__canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.graph-editor__side {
  display: flex;
  flex-direction: column;
  width: 280px;
  min-height: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
}

.graph-editor__side--collapsed {
  width: auto;
}

.graph-editor__collapse {
  align-self: flex-start;
  width: var(--control-height-sm);
  height: var(--control-height-sm);
  margin: var(--space-2) var(--space-2) 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
}

.graph-editor__collapse:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.graph-editor__collapse:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-editor__properties {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
