<script setup lang="ts">
import { MarkerType, VueFlow } from "@vue-flow/core";
import SpecialNode from "./SpecialNode.vue";
import SpecialEdge from "./SpecialEdge.vue";
import { useNodeStore } from "@/features/graph/stores/nodes";
import {
  ref,
  computed,
  provide,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import HelpingModal from "@/features/graph/ui/graph/HelpingModal.vue";
import Background from "./Background.vue";
import RightClickModal from "@/features/graph/ui/graph/RightClickModal.vue";
import DownloadGraphButton from "@/features/graph/ui/graph/DownloadGraphButton.vue";
import { useVueFlowBus } from "@/features/graph/stores/vueFlowBus";
import { setupNodeChangesHandler } from "@/features/graph/lib/flowEventsHandlers/nodeEventsHandling";
import { setupEdgeChangesHandler } from "@/features/graph/lib/flowEventsHandlers/edgeEventsHandling";
import SettingsDropDown from "@/features/graph/ui/graph/SettingsModal.vue";
import HotKeysListener from "@/features/graph/ui/graph/HotKeysListener.vue";
import { GraphType } from "@/__generated__/graphql";
import {
  graphCanColorKey,
  graphNodeDraggingActiveKey,
} from "@/features/graph/ui/graph/graphConstructorPolicy";
import { GRAPH_VUE_FLOW_ID } from "@/features/graph/stores/vueFlowBus";
import { graphSettingsStore } from "@/features/graph/stores/graphSettings";

interface Props {
  style?: Record<string, string | number>;
  canColor?: boolean;
  graphType?: GraphType;
}

const props = withDefaults(defineProps<Props>(), {
  canColor: true,
});

const nodeStore = useNodeStore();
let cleanupEdgeHandlers: (() => void) | undefined;
let cleanupNodeHandlers: (() => void) | undefined;
let cleanupPaneContextMenu: (() => void) | undefined;
const graphNodes = computed({
  get: () => nodeStore.nodes as any,
  set: (value) => {
    nodeStore.nodes = value as any;
  },
});
const graphEdges = computed({
  get: () => nodeStore.edges as any,
  set: (value) => {
    nodeStore.edges = value as any;
  },
});
const canColor = computed(() => props.canColor);
provide(graphCanColorKey, canColor);
const isMoveModifierPressed = ref(false);
const isNodeDraggingActive = computed(
  () => graphSettingsStore.isMoveMode || isMoveModifierPressed.value,
);
provide(graphNodeDraggingActiveKey, isNodeDraggingActive);

const { vueFlowState } = useVueFlowBus();
provide("vueFlowState", vueFlowState);

const { onPaneContextMenu, project, setEdges, fitView, updateNodeInternals } =
  vueFlowState;

const contextMenuPosition = ref({
  position: { x: 0, y: 0 },
  modalPosition: { x: 0, y: 0 },
});
const isHelpModalOpen = ref(false);
const isRightClickModalOpen = ref(false);
const connectionLineOptions = computed(() => ({
  style: {
    strokeWidth: 2,
  },
  ...(nodeStore.isDirected
    ? {
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    : {}),
}));

const syncMoveModifierState = (event?: KeyboardEvent) => {
  isMoveModifierPressed.value = !!(event?.ctrlKey || event?.metaKey);
};

const resetMoveModifierState = () => {
  isMoveModifierPressed.value = false;
};

onMounted(() => {
  cleanupEdgeHandlers = setupEdgeChangesHandler();
  cleanupNodeHandlers = setupNodeChangesHandler();
  window.addEventListener("keydown", syncMoveModifierState);
  window.addEventListener("keyup", syncMoveModifierState);
  window.addEventListener("blur", resetMoveModifierState);

  const paneContextMenuHook = onPaneContextMenu((event) => {
    event.preventDefault();
    isRightClickModalOpen.value = false;

    const pane = event.currentTarget as HTMLElement;
    const bounds = pane.getBoundingClientRect();

    const modalPosition = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    const graphPosition = project(modalPosition);

    contextMenuPosition.value = {
      modalPosition,
      position: graphPosition,
    };

    isRightClickModalOpen.value = true;
  });

  cleanupPaneContextMenu = paneContextMenuHook.off;
});

onUnmounted(() => {
  cleanupEdgeHandlers?.();
  cleanupNodeHandlers?.();
  cleanupPaneContextMenu?.();
  window.removeEventListener("keydown", syncMoveModifierState);
  window.removeEventListener("keyup", syncMoveModifierState);
  window.removeEventListener("blur", resetMoveModifierState);

  cleanupEdgeHandlers = undefined;
  cleanupNodeHandlers = undefined;
  cleanupPaneContextMenu = undefined;
});

const toggleMoveMode = () => {
  graphSettingsStore.isMoveMode = !graphSettingsStore.isMoveMode;
  graphSettingsStore.saveToLocalStorage();
};

const handleAddNodeAtPosition = () => {
  nodeStore.addNode({
    x: contextMenuPosition.value.position.x,
    y: contextMenuPosition.value.position.y,
  });
};

const openHelpModal = () => {
  isHelpModalOpen.value = true;
};

const closeHelpModal = () => {
  isHelpModalOpen.value = false;
};

const closeRightClickModal = () => {
  isRightClickModalOpen.value = false;
};

const uploadJson = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const data = JSON.parse(content);
        nodeStore.nodes = data.nodes;
        nodeStore.edges = data.edges;
        nodeStore.regenerateStatistics();
      } catch (error) {
        console.error("Ошибка при чтении файла:", error);
      }
    };
    reader.readAsText(file);
  }
};

const undo = () => {
  nodeStore.undo();
  setTimeout(fitView, 200);
};

const clearBoard = () => {
  nodeStore.clearBoard();
};

const addNodeToCenter = () => {
  const { width, height } = document
    .querySelector(".pinia-flow")!
    .getBoundingClientRect();
  const centerX = width / 2;
  const centerY = height / 2;
  const pos = project({ x: centerX, y: centerY });
  nodeStore.addNode({
    x: pos.x + Math.random() * 100,
    y: pos.y + Math.random() * 100,
  });
};

const normalize = () => {
  const edges = nodeStore.normalizeView();
  setEdges(JSON.parse(JSON.stringify(edges)) as any);
  setTimeout(() => fitView({ padding: 5, includeHiddenNodes: true }), 150);
};

watch(
  () => props.graphType,
  (graphType) => {
    if (graphType === GraphType.Direct) {
      nodeStore.isDirected = true;
    }
    if (graphType === GraphType.Undirect) {
      nodeStore.isDirected = false;
    }
  },
  { immediate: true },
);

watch(
  () => graphSettingsStore.isOneHandle,
  async () => {
    await nextTick();
    updateNodeInternals(nodeStore.nodes.map((node) => node.id));
  },
);

const isGraphTypeLocked = computed(
  () => props.graphType === GraphType.Direct || props.graphType === GraphType.Undirect,
);

</script>

<template>
  <div class="graph-editor" :style="props.style">
    <div class="buttons-container">
      <v-btn variant="text" color="white" size="small" @click="addNodeToCenter">Добавить вершину</v-btn>
      <v-btn variant="text" color="white" size="small" @click="undo">UNDO</v-btn>
      <v-btn variant="text" color="white" size="small" @click="clearBoard">Очистить доску</v-btn>
      <DownloadGraphButton />
      <v-btn variant="text" color="white" size="small" @click="toggleMoveMode">
        {{ graphSettingsStore.isMoveMode ? "Режим связей" : "Режим передвижения" }}
      </v-btn>
      <v-btn variant="text" color="white" size="small" @click="nodeStore.toggleIsDirected" :disabled="isGraphTypeLocked">
        Сменить направленность
      </v-btn>
      <v-btn variant="text" color="white" size="small" @click="normalize">Нормализовать граф</v-btn>
      <v-btn variant="text" color="white" size="small">
        <label for="upload-json" style="cursor: pointer">Загрузить JSON</label>
        <input
          id="upload-json"
          type="file"
          accept=".json"
          style="display: none"
          @change="uploadJson"
        />
      </v-btn>
      <v-btn variant="text" color="white" size="small" @click="openHelpModal">Как работать с графом?</v-btn>
      <SettingsDropDown />
    </div>
    <VueFlow
      :id="GRAPH_VUE_FLOW_ID"
      :connection-radius="50"
      :connection-line-options="connectionLineOptions"
      :edge-updater-radius="20"
      :connect-on-click="false"
      :nodes-draggable="isNodeDraggingActive"
      v-model:nodes="graphNodes"
      v-model:edges="graphEdges"
      class="pinia-flow"
      @pane-click="closeRightClickModal"
    >
      <RightClickModal
        v-if="isRightClickModalOpen"
        :modal-position="contextMenuPosition.modalPosition"
        :position="contextMenuPosition.position"
        @close="isRightClickModalOpen = false"
        @add-node="handleAddNodeAtPosition"
      />
      <Background />
      <HotKeysListener />
      <template #node-special="specialNodeProps">
        <SpecialNode v-bind="specialNodeProps" />
      </template>
      <template #edge-special="specialEdgeProps">
        <SpecialEdge v-bind="specialEdgeProps" />
      </template>
    </VueFlow>
    <HelpingModal
      :isHelpModalOpen="isHelpModalOpen"
      :closeHelpModal="closeHelpModal"
    />
  </div>
</template>

<style>
@import "../../../../../node_modules/@vue-flow/core/dist/style.css";
@import "../../../../../node_modules/@vue-flow/core/dist/theme-default.css";

.graph-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.buttons-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  width: 100%;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
}

.buttons-container::-webkit-scrollbar {
  display: none;
}

.pinia-flow {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  height: auto;
  min-height: 400px;
  overflow: hidden;
}
</style>
