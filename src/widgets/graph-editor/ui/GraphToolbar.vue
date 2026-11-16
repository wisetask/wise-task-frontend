<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { isTyping } from "../lib/pointer";
import type { EditorTool } from "../lib/selection";

interface ToolButton {
  id: EditorTool;
  title: string;
  hotkey: string;
}

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
}>();

const tool = defineModel<EditorTool>("tool", { required: true });

const tools: ToolButton[] = [
  { id: "select", title: "Выбор и перемещение", hotkey: "1" },
  { id: "vertex", title: "Вершина", hotkey: "2" },
  { id: "edge", title: "Ребро", hotkey: "3" },
  { id: "delete", title: "Удаление", hotkey: "4" },
];

function isUndoKey(event: KeyboardEvent): boolean {
  return event.code === "KeyZ" && !event.shiftKey;
}

function isRedoKey(event: KeyboardEvent): boolean {
  return (event.code === "KeyZ" && event.shiftKey) || event.code === "KeyY";
}

function undo() {
  if (props.canUndo) {
    emit("undo");
  }
}

function redo() {
  if (props.canRedo) {
    emit("redo");
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (isTyping(event)) {
    return;
  }
  if (event.ctrlKey || event.metaKey) {
    if (isUndoKey(event)) {
      event.preventDefault();
      undo();
    } else if (isRedoKey(event)) {
      event.preventDefault();
      redo();
    }
    return;
  }
  if (event.altKey) {
    return;
  }
  for (const button of tools) {
    if (event.key === button.hotkey) {
      tool.value = button.id;
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <nav class="graph-toolbar" aria-label="Инструменты редактора">
    <button
      v-for="button in tools"
      :key="button.id"
      type="button"
      class="graph-toolbar__button"
      :class="{ 'graph-toolbar__button--active': tool === button.id }"
      :aria-pressed="tool === button.id"
      :title="button.title + ' (' + button.hotkey + ')'"
      @click="tool = button.id"
    >
      <svg class="graph-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          v-if="button.id === 'select'"
          d="M5 3 L5 19 L9.5 14.5 L12.5 21 L15 20 L12 13.5 L18 13.5 Z"
        />
        <circle v-if="button.id === 'vertex'" cx="12" cy="12" r="6" />
        <g v-if="button.id === 'edge'">
          <line x1="6" y1="18" x2="18" y2="6" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="6" r="3" />
        </g>
        <g v-if="button.id === 'delete'">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </g>
      </svg>
      <span class="graph-toolbar__label">{{ button.title }}</span>
    </button>

    <hr class="graph-toolbar__divider" />

    <button
      type="button"
      class="graph-toolbar__button"
      title="Отменить (Ctrl+Z)"
      :disabled="!canUndo"
      @click="undo"
    >
      <svg class="graph-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 14 L4 9 L9 4" />
        <path d="M4 9 H14 A6 6 0 0 1 14 21 H10" />
      </svg>
      <span class="graph-toolbar__label">Отменить</span>
    </button>
    <button
      type="button"
      class="graph-toolbar__button"
      title="Повторить (Ctrl+Shift+Z)"
      :disabled="!canRedo"
      @click="redo"
    >
      <svg class="graph-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 14 L20 9 L15 4" />
        <path d="M20 9 H10 A6 6 0 0 0 10 21 H14" />
      </svg>
      <span class="graph-toolbar__label">Повторить</span>
    </button>
  </nav>
</template>

<style scoped>
.graph-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
}

.graph-toolbar__button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.graph-toolbar__button:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.graph-toolbar__button:disabled {
  color: var(--color-text-muted);
  opacity: 0.45;
  cursor: not-allowed;
}

.graph-toolbar__divider {
  width: 100%;
  margin: var(--space-1) 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.graph-toolbar__button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-toolbar__button--active,
.graph-toolbar__button--active:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.graph-toolbar__icon {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.graph-toolbar__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
