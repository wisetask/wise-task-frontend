<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import type { Graph, GraphColor, Vertex } from "@/entities/graph";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { svgToPng } from "@/shared/lib/svgToPng";
import { GraphCanvas, graphToSvg, imageFileName } from "@/widgets/graph-editor";
import {
  closeIds,
  drawDelay,
  graphSummary,
  popDelay,
  PREVIEW_RADIUS,
  previewBox,
  previewEdges,
  vertexCaption,
  type PreviewEdge,
} from "../lib/graphPreview";

const props = defineProps<{
  graph: Graph;
}>();

const markerId = "preview-arrow-" + useId().replace(/[^a-zA-Z0-9-]/g, "");
const hovered = ref<string | null>(null);
const pinned = ref<string | null>(null);
const expanded = ref(false);
const saving = ref(false);
const saveFailed = ref(false);
const closeButton = ref<HTMLButtonElement | null>(null);

const box = computed(() => previewBox(props.graph));
const viewBox = computed(
  () => box.value.x + " " + box.value.y + " " + box.value.width + " " + box.value.height,
);
const frameRatio = computed(() => box.value.width + " / " + box.value.height);
const edges = computed(() => previewEdges(props.graph));
const summary = computed(() => graphSummary(props.graph));
const arrow = computed(() => (props.graph.isDirected ? "url(#" + markerId + ")" : undefined));

const focusId = computed(() => (hovered.value !== null ? hovered.value : pinned.value));
const close = computed(() => {
  if (focusId.value === null) {
    return null;
  }
  return closeIds(props.graph, focusId.value);
});

const caption = computed(() => {
  if (saveFailed.value) {
    return "Не получилось сохранить картинку.";
  }
  if (focusId.value === null) {
    return "Наведите на вершину — покажу её соседей. Клик закрепляет.";
  }
  return vertexCaption(props.graph, focusId.value);
});

function touches(edge: PreviewEdge): boolean {
  return focusId.value !== null && (edge.source === focusId.value || edge.target === focusId.value);
}

function edgeClass(edge: PreviewEdge): Record<string, boolean> {
  return {
    "graph-preview__edge--touched": touches(edge),
    "graph-preview__edge--dim": focusId.value !== null && !touches(edge),
  };
}

function colorClass(color: GraphColor): string {
  return "graph-preview__vertex--" + color.toLowerCase();
}

function vertexClass(vertex: Vertex): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  result[colorClass(vertex.color)] = true;
  result["graph-preview__vertex--focus"] = vertex.id === focusId.value;
  result["graph-preview__vertex--near"] =
    close.value !== null && close.value[vertex.id] === true && vertex.id !== focusId.value;
  result["graph-preview__vertex--dim"] = close.value !== null && close.value[vertex.id] !== true;
  result["graph-preview__vertex--pinned"] = vertex.id === pinned.value;
  return result;
}

function togglePin(id: string) {
  pinned.value = pinned.value === id ? null : id;
}

async function savePng() {
  if (saving.value) {
    return;
  }
  saving.value = true;
  saveFailed.value = false;
  const image = graphToSvg(props.graph);
  try {
    const blob = await svgToPng(image.svg, image.width, image.height, 2);
    downloadBlob(imageFileName(props.graph, "png"), blob);
  } catch {
    saveFailed.value = true;
  } finally {
    saving.value = false;
  }
}

function openViewer() {
  expanded.value = true;
  nextTick(() => {
    if (closeButton.value !== null) {
      closeButton.value.focus();
    }
  });
}

function closeViewer() {
  expanded.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeViewer();
  }
}

watch(expanded, (value) => {
  if (value) {
    window.addEventListener("keydown", onKeydown);
  } else {
    window.removeEventListener("keydown", onKeydown);
  }
});

watch(
  () => props.graph,
  () => {
    hovered.value = null;
    pinned.value = null;
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div class="graph-preview">
    <ul class="graph-preview__summary">
      <li
        v-for="(item, index) in summary"
        :key="item"
        class="graph-preview__fact"
        :style="{ animationDelay: index * 60 + 'ms' }"
      >
        {{ item }}
      </li>
    </ul>

    <div class="graph-preview__frame" :style="{ aspectRatio: frameRatio }">
      <p v-if="graph.vertices.length === 0" class="graph-preview__empty">Граф пустой</p>
      <svg
        v-else
        class="graph-preview__svg"
        :viewBox="viewBox"
        role="img"
        :aria-label="'Граф задачи: ' + summary.join(', ')"
      >
        <defs>
          <marker
            :id="markerId"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path class="graph-preview__arrow" d="M0 0 L10 5 L0 10 Z" />
          </marker>
        </defs>

        <g
          v-for="(edge, index) in edges"
          :key="edge.id"
          class="graph-preview__edge"
          :class="edgeClass(edge)"
        >
          <path
            class="graph-preview__line"
            :d="edge.path"
            pathLength="1"
            :marker-end="arrow"
            :style="{ animationDelay: drawDelay(index) }"
          />
          <path v-if="touches(edge)" class="graph-preview__flow" :d="edge.path" pathLength="1" />
          <text
            v-if="edge.text !== ''"
            class="graph-preview__weight"
            :x="edge.textX"
            :y="edge.textY + 4"
            text-anchor="middle"
          >
            {{ edge.text }}
          </text>
        </g>

        <g
          v-for="(vertex, index) in graph.vertices"
          :key="vertex.id"
          class="graph-preview__vertex"
          :class="vertexClass(vertex)"
          @mouseenter="hovered = vertex.id"
          @mouseleave="hovered = null"
          @click="togglePin(vertex.id)"
        >
          <g class="graph-preview__body" :style="{ animationDelay: popDelay(index) }">
            <circle
              v-if="vertex.id === pinned"
              class="graph-preview__ping"
              :cx="vertex.x"
              :cy="vertex.y"
              :r="PREVIEW_RADIUS + 4"
            />
            <circle
              class="graph-preview__circle"
              :cx="vertex.x"
              :cy="vertex.y"
              :r="PREVIEW_RADIUS"
            />
            <text class="graph-preview__label" :x="vertex.x" :y="vertex.y + 5" text-anchor="middle">
              {{ vertex.label }}
            </text>
          </g>
        </g>
      </svg>

      <div class="graph-preview__actions">
        <button
          type="button"
          class="graph-preview__action"
          title="Открыть крупно"
          aria-label="Открыть граф крупно"
          @click="openViewer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 4 H20 V10 M20 4 L13.5 10.5 M10 20 H4 V14 M4 20 L10.5 13.5" />
          </svg>
        </button>
        <button
          type="button"
          class="graph-preview__action"
          :class="{ 'graph-preview__action--busy': saving }"
          title="Скачать картинку PNG"
          aria-label="Скачать граф картинкой PNG"
          :disabled="graph.vertices.length === 0"
          @click="savePng"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4 V15 M7 10.5 L12 15.5 L17 10.5 M5 20 H19" />
          </svg>
        </button>
      </div>
    </div>

    <p
      class="graph-preview__caption"
      :class="{ 'graph-preview__caption--active': focusId !== null }"
      aria-live="polite"
    >
      {{ caption }}
    </p>

    <Teleport to="body">
      <Transition name="graph-preview-viewer">
        <div v-if="expanded" class="graph-preview__backdrop" @click.self="closeViewer">
          <div
            class="graph-preview__viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Граф задачи"
          >
            <header class="graph-preview__viewer-head">
              <p class="graph-preview__viewer-title">Граф задачи</p>
              <ul class="graph-preview__summary">
                <li v-for="item in summary" :key="item" class="graph-preview__fact">
                  {{ item }}
                </li>
              </ul>
              <button
                ref="closeButton"
                type="button"
                class="graph-preview__action graph-preview__viewer-close"
                title="Закрыть (Esc)"
                aria-label="Закрыть"
                @click="closeViewer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </header>
            <div class="graph-preview__viewer-canvas">
              <GraphCanvas :graph="graph" readonly />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.graph-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.graph-preview__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.graph-preview__fact {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  font-size: 12px;
  animation: graph-preview-chip 360ms var(--ease-spring) backwards;
}

.graph-preview__frame {
  position: relative;
  min-height: 170px;
  max-height: 340px;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--graph-canvas-bg);
  background-image: radial-gradient(
    color-mix(in srgb, var(--color-text-muted) 28%, transparent) 1px,
    transparent 1.5px
  );
  background-size: 18px 18px;
  box-shadow: inset 0 0 40px color-mix(in srgb, var(--color-accent) 8%, transparent);
  transition:
    border-color var(--duration) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
}

.graph-preview__frame:hover {
  border-color: color-mix(in srgb, var(--color-accent) 60%, var(--color-border));
  box-shadow:
    inset 0 0 50px color-mix(in srgb, var(--color-accent) 14%, transparent),
    var(--shadow-card);
}

.graph-preview__svg {
  display: block;
  width: 100%;
  height: 100%;
  font-family: var(--font-family);
}

.graph-preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  color: var(--color-text-muted);
}

.graph-preview__line {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  animation: graph-preview-draw 600ms var(--ease-out) backwards;
  transition:
    stroke var(--duration) var(--ease-out),
    stroke-width var(--duration) var(--ease-out);
}

.graph-preview__arrow {
  fill: var(--graph-edge);
}

.graph-preview__edge {
  transition: opacity var(--duration) var(--ease-out);
}

.graph-preview__edge--dim {
  opacity: 0.22;
}

.graph-preview__edge--touched .graph-preview__line {
  stroke: var(--color-accent);
  stroke-width: 3.5;
}

.graph-preview__flow {
  fill: none;
  stroke: var(--graph-active);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 0.04 0.08;
  pointer-events: none;
  animation: graph-preview-flow 900ms linear infinite;
}

.graph-preview__weight {
  fill: var(--color-text);
  font-size: 13px;
  font-weight: 700;
  paint-order: stroke;
  stroke: var(--graph-canvas-bg);
  stroke-width: 5px;
  stroke-linejoin: round;
  pointer-events: none;
}

.graph-preview__vertex {
  cursor: pointer;
  transition: opacity var(--duration) var(--ease-out);
}

.graph-preview__body {
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-preview-pop 460ms var(--ease-spring) backwards;
  transition: transform var(--duration) var(--ease-spring);
}

.graph-preview__circle {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
  transition:
    stroke var(--duration) var(--ease-out),
    stroke-width var(--duration) var(--ease-out);
}

.graph-preview__vertex--red .graph-preview__circle {
  fill: var(--graph-red-fill);
  stroke: var(--graph-red-stroke);
}

.graph-preview__vertex--green .graph-preview__circle {
  fill: var(--graph-green-fill);
  stroke: var(--graph-green-stroke);
}

.graph-preview__vertex--blue .graph-preview__circle {
  fill: var(--graph-blue-fill);
  stroke: var(--graph-blue-stroke);
}

.graph-preview__label {
  fill: var(--graph-vertex-text);
  font-size: 14px;
  font-weight: 700;
  pointer-events: none;
}

.graph-preview__vertex:hover .graph-preview__body,
.graph-preview__vertex--focus .graph-preview__body {
  transform: scale(1.18);
}

.graph-preview__vertex--focus .graph-preview__circle {
  stroke: var(--color-accent);
  stroke-width: 3.5;
}

.graph-preview__vertex--near .graph-preview__circle {
  stroke: var(--graph-active);
  stroke-width: 3;
}

.graph-preview__vertex--dim {
  opacity: 0.3;
}

.graph-preview__ping {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: graph-preview-ping 1.4s var(--ease-out) infinite;
}

.graph-preview__actions {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  gap: 4px;
  opacity: 0.55;
  transform: translateY(-2px);
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.graph-preview__frame:hover .graph-preview__actions,
.graph-preview__actions:focus-within {
  opacity: 1;
  transform: none;
}

.graph-preview__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.graph-preview__action:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-2px);
}

.graph-preview__action:disabled {
  cursor: default;
  opacity: 0.5;
}

.graph-preview__action:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-preview__action svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.graph-preview__action--busy svg {
  animation: graph-preview-drop 700ms ease-in-out infinite;
}

.graph-preview__caption {
  min-height: 1.4em;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  transition: color var(--duration) var(--ease-out);
}

.graph-preview__caption--active {
  color: var(--color-text);
}

.graph-preview__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  background: color-mix(in srgb, var(--color-page) 70%, transparent);
  backdrop-filter: blur(6px);
}

.graph-preview__viewer {
  display: flex;
  flex-direction: column;
  width: min(1100px, 100%);
  height: min(760px, 100%);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.graph-preview__viewer-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.graph-preview__viewer-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.graph-preview__viewer-close {
  margin-left: auto;
}

.graph-preview__viewer-canvas {
  flex: 1;
  min-height: 0;
}

.graph-preview-viewer-enter-active,
.graph-preview-viewer-leave-active {
  transition: opacity var(--duration) var(--ease-out);
}

.graph-preview-viewer-enter-active .graph-preview__viewer {
  transition: transform 360ms var(--ease-spring);
}

.graph-preview-viewer-leave-active .graph-preview__viewer {
  transition: transform var(--duration) var(--ease-out);
}

.graph-preview-viewer-enter-from,
.graph-preview-viewer-leave-to {
  opacity: 0;
}

.graph-preview-viewer-enter-from .graph-preview__viewer,
.graph-preview-viewer-leave-to .graph-preview__viewer {
  transform: scale(0.92) translateY(12px);
}

@keyframes graph-preview-chip {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
}

@keyframes graph-preview-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes graph-preview-pop {
  from {
    opacity: 0;
    transform: scale(0);
  }
}

@keyframes graph-preview-flow {
  to {
    stroke-dashoffset: -0.12;
  }
}

@keyframes graph-preview-ping {
  from {
    opacity: 0.9;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.6);
  }
}

@keyframes graph-preview-drop {
  50% {
    transform: translateY(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-preview__flow,
  .graph-preview__ping,
  .graph-preview__action--busy svg {
    animation: none !important;
  }
}
</style>
