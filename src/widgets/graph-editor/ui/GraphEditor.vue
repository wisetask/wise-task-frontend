<script setup lang="ts">
import { ref, watch } from "vue";
import type { Graph } from "@/entities/graph";
import { useGraphHistory } from "@/features/graph-history";
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

defineExpose({
  replaceGraph: replaceGraph,
  startOver: startOver,
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
    <GraphPropertiesPanel
      v-if="!readonly"
      v-model:graph="graph"
      v-model:selection="selection"
      class="graph-editor__properties"
      @before-change="onBeforeChange"
    />
  </div>
</template>

<style scoped>
.graph-editor {
  display: grid;
  grid-template-columns: auto 1fr 280px;
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

.graph-editor__properties {
  overflow-y: auto;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
}
</style>
