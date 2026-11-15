<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import {
  ConnectionSourceID,
  ConnectionTargetID,
} from "@/features/graph/types/CustomEdge";
import { computed, inject } from "vue";
import { graphSettingsStore } from "@/features/graph/stores/graphSettings";
import { graphNodeDraggingActiveKey } from "@/features/graph/ui/graph/graphConstructorPolicy";
import { isValidSelfLoopConnection } from "@/features/graph/lib/helpers/resolveConnectionHandles";

const props = defineProps<{
  isEditing: boolean;
}>();

const isOneHandle = computed(() => {
  return graphSettingsStore.isOneHandle;
});

const isNodeDraggingActive = inject(
  graphNodeDraggingActiveKey,
  computed(() => false),
);

const sourceHandles = [
  { id: ConnectionSourceID.Right, position: Position.Right },
  { id: ConnectionSourceID.Left, position: Position.Left },
  { id: ConnectionSourceID.Top, position: Position.Top },
  { id: ConnectionSourceID.Bottom, position: Position.Bottom },
];

const targetHandles = [
  { id: ConnectionTargetID.Right, position: Position.Right },
  { id: ConnectionTargetID.Left, position: Position.Left },
  { id: ConnectionTargetID.Top, position: Position.Top },
  { id: ConnectionTargetID.Bottom, position: Position.Bottom },
];

const checkValidConnection = (connection: any) => {
  if (props.isEditing || isNodeDraggingActive.value) {
    return false;
  }

  if (!isOneHandle.value && connection.source === connection.target) {
    return isValidSelfLoopConnection(connection);
  }

  return true;
};

const isConnectionOverlayActive = computed(
  () => isOneHandle.value && !props.isEditing && !isNodeDraggingActive.value,
);
</script>

<template>
  <div v-if="isOneHandle">
    <Handle
      v-for="handle in sourceHandles"
      :key="handle.id"
      type="source"
      :id="handle.id"
      :position="handle.position"
      :is-valid-connection="checkValidConnection"
      class="geometry-handle geometry-handle--hidden"
    />
    <Handle
      v-for="handle in targetHandles"
      :key="handle.id"
      type="target"
      :id="handle.id"
      :position="handle.position"
      :is-valid-connection="checkValidConnection"
      class="geometry-handle geometry-handle--hidden"
    />

    <div v-if="isConnectionOverlayActive" class="full-surface-handle-anchor">
      <Handle
        type="source"
        :id="ConnectionSourceID.Center"
        :position="Position.Right"
        :is-valid-connection="checkValidConnection"
        :connectable-start="true"
        :connectable-end="true"
        class="full-surface-overlay-handle"
      />
    </div>
  </div>
  <div v-else>
    <Handle
      v-for="handle in sourceHandles"
      :key="handle.id"
      type="source"
      :id="handle.id"
      :position="handle.position"
      :is-valid-connection="checkValidConnection"
      class="full-node-handle"
    />
    <Handle
      v-for="handle in targetHandles"
      :key="handle.id"
      type="target"
      :id="handle.id"
      :position="handle.position"
      :is-valid-connection="checkValidConnection"
      class="full-node-handle"
    />
  </div>
</template>

<style>
.geometry-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: auto;
}

.geometry-handle--hidden {
  opacity: 0;
  pointer-events: none;
  border: none;
  background: transparent;
}

.full-surface-handle-anchor {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.full-surface-overlay-handle {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  transform: none !important;
  opacity: 0;
  pointer-events: auto;
  border: none;
  background: transparent;
  border-radius: 50%;
}

.full-surface-overlay-handle--passive {
  pointer-events: none;
}

.full-node-handle {
  position: absolute;
  padding: 2px;
  pointer-events: auto;
}

.full-node-handle.source {
  z-index: 3;
}

.full-node-handle.target {
  z-index: 2;
}
</style>
