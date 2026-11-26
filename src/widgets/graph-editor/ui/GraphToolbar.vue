<script setup lang="ts">
import { computed } from "vue";
import { DEFAULT_HOTKEYS, hotkeyText, toolAction, withHotkey } from "../lib/hotkeys";
import { allowEverything, canUseTool, type EditorRules } from "../lib/rules";
import type { EditorTool } from "../lib/selection";

interface ToolButton {
  id: EditorTool;
  title: string;
  tip: string;
}

const props = withDefaults(
  defineProps<{
    rules?: EditorRules;
  }>(),
  {
    rules: () => allowEverything(),
  },
);

const emit = defineEmits<{
  help: [];
}>();

const tool = defineModel<EditorTool>("tool", { required: true });

const BUTTON_SIZE = 44;
const BUTTON_GAP = 4;

const ALL_TOOLS: ToolButton[] = [
  { id: "select", title: "Выбор и перемещение", tip: "Выбор — клик, рамка, перетаскивание" },
  { id: "pan", title: "Рука — двигать холст", tip: "Рука — двигать холст" },
  { id: "vertex", title: "Вершина", tip: "Вершина — клик по пустому месту" },
  { id: "edge", title: "Ребро", tip: "Ребро — от вершины к вершине" },
  { id: "delete", title: "Удаление", tip: "Удаление — клик по вершине или ребру" },
];

const tools = computed(() => {
  const allowed: ToolButton[] = [];
  for (const button of ALL_TOOLS) {
    if (canUseTool(button.id, props.rules)) {
      allowed.push(button);
    }
  }
  return allowed;
});

const activeIndex = computed(() => {
  for (let index = 0; index < tools.value.length; index++) {
    if (tools.value[index].id === tool.value) {
      return index;
    }
  }
  return -1;
});

const indicatorStyle = computed(() => {
  return { transform: "translateY(" + activeIndex.value * (BUTTON_SIZE + BUTTON_GAP) + "px)" };
});

const helpTitle = withHotkey("Горячие клавиши", "help", DEFAULT_HOTKEYS);

function toolTitle(button: ToolButton): string {
  return withHotkey(button.title, toolAction(button.id), DEFAULT_HOTKEYS);
}

function toolKey(button: ToolButton): string {
  return hotkeyText(toolAction(button.id), DEFAULT_HOTKEYS);
}
</script>

<template>
  <nav class="graph-toolbar" aria-label="Инструменты редактора">
    <div class="graph-toolbar__tools">
      <span
        v-if="activeIndex >= 0"
        class="graph-toolbar__indicator"
        :style="indicatorStyle"
        aria-hidden="true"
      />
      <button
        v-for="button in tools"
        :key="button.id"
        type="button"
        class="graph-toolbar__button"
        :class="{ 'graph-toolbar__button--active': tool === button.id }"
        :aria-pressed="tool === button.id"
        :aria-label="toolTitle(button)"
        @click="tool = button.id"
      >
        <svg class="graph-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            v-if="button.id === 'select'"
            d="M5 3 L5 19 L9.5 14.5 L12.5 21 L15 20 L12 13.5 L18 13.5 Z"
          />
          <g v-if="button.id === 'pan'">
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <path d="M9 6 L12 3 L15 6" />
            <path d="M9 18 L12 21 L15 18" />
            <path d="M6 9 L3 12 L6 15" />
            <path d="M18 9 L21 12 L18 15" />
          </g>
          <g v-if="button.id === 'vertex'">
            <circle cx="12" cy="12" r="6" />
            <line x1="12" y1="9.5" x2="12" y2="14.5" />
            <line x1="9.5" y1="12" x2="14.5" y2="12" />
          </g>
          <g v-if="button.id === 'edge'">
            <line x1="6" y1="18" x2="18" y2="6" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="6" r="3" />
          </g>
          <g v-if="button.id === 'delete'">
            <path d="M5 7 H19" />
            <path d="M9 7 V4.5 H15 V7" />
            <path d="M7 7 L8 20 H16 L17 7" />
          </g>
        </svg>
        <kbd class="graph-toolbar__key" aria-hidden="true">{{ toolKey(button) }}</kbd>
        <span class="graph-toolbar__tip" role="tooltip">
          {{ button.tip }}
          <kbd class="graph-toolbar__tip-key">{{ toolKey(button) }}</kbd>
        </span>
      </button>
    </div>

    <hr class="graph-toolbar__divider" />

    <button
      type="button"
      class="graph-toolbar__button graph-toolbar__button--bottom"
      :aria-label="helpTitle"
      @click="emit('help')"
    >
      <svg class="graph-toolbar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5 A2.5 2.5 0 1 1 12 12 V13.5" />
        <line x1="12" y1="17" x2="12" y2="17.01" />
      </svg>
      <span class="graph-toolbar__tip" role="tooltip">
        Горячие клавиши
        <kbd class="graph-toolbar__tip-key">?</kbd>
      </span>
    </button>
  </nav>
</template>

<style scoped>
.graph-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.graph-toolbar__tools {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.graph-toolbar__indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-accent-muted);
  box-shadow: inset 0 0 0 1px var(--color-accent);
  transition: transform 320ms var(--ease-spring);
}

.graph-toolbar__button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.graph-toolbar__button:hover:not(.graph-toolbar__button--active) {
  background: var(--color-surface-hover);
}

.graph-toolbar__button:active {
  transform: scale(0.92);
}

.graph-toolbar__button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-toolbar__button--active {
  color: var(--color-accent);
}

.graph-toolbar__button--bottom {
  margin-top: auto;
}

.graph-toolbar__divider {
  width: 100%;
  margin: var(--space-1) 0;
  border: none;
  border-top: 1px solid var(--color-border);
}

.graph-toolbar__icon {
  position: relative;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  transition: transform var(--duration) var(--ease-spring);
}

.graph-toolbar__button:hover .graph-toolbar__icon {
  transform: scale(1.12);
}

.graph-toolbar__key {
  position: absolute;
  right: 3px;
  bottom: 2px;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.graph-toolbar__button--active .graph-toolbar__key {
  color: var(--color-accent);
}

.graph-toolbar__tip {
  position: absolute;
  top: 50%;
  left: calc(100% + 12px);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-surface);
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-6px, -50%);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.graph-toolbar__button:hover .graph-toolbar__tip,
.graph-toolbar__button:focus-visible .graph-toolbar__tip {
  opacity: 1;
  transform: translate(0, -50%);
  transition-delay: 250ms;
}

.graph-toolbar__tip-key {
  padding: 1px 6px;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 11px;
  opacity: 0.7;
}
</style>
