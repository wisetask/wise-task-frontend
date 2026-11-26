<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import {
  createEmptyGraph,
  graphFileName,
  graphFromFileText,
  graphToFileText,
  setDirected,
  type Graph,
} from "@/entities/graph";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { downloadText } from "@/shared/lib/downloadText";
import { svgToPng } from "@/shared/lib/svgToPng";
import { UiIconButton, UiMenuButton, type UiMenuItem } from "@/shared/ui";
import {
  allowEverything,
  directedByRules,
  GraphEditor,
  GraphRulesForm,
  graphToSvg,
  imageFileName,
  type EditorRules,
  type EditorTool,
} from "@/widgets/graph-editor";
import { browserStorage, loadGraph, saveGraph } from "../lib/savedGraph";

const storage = browserStorage();
const savedGraph = loadGraph(storage);
const graph = ref<Graph>(savedGraph === null ? createEmptyGraph(false) : savedGraph);
const tool = ref<EditorTool>("vertex");
const viewOnly = ref(false);
const rules = ref<EditorRules>(allowEverything());
const rulesOpen = ref(false);
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const notice = ref("");
const noticeIsError = ref(false);

const DOWNLOAD_ITEMS: UiMenuItem[] = [
  { id: "json", label: "Граф (.json)" },
  { id: "png", label: "Картинка PNG" },
  { id: "svg", label: "Картинка SVG" },
];

const directedTitle = computed(() =>
  graph.value.isDirected ? "Сделать неориентированным" : "Сделать ориентированным",
);

watch(graph, (value) => {
  saveGraph(storage, value);
});

watch(
  () => rules.value.direction,
  () => {
    const directed = directedByRules(rules.value);
    if (editor.value !== null && directed !== null && directed !== graph.value.isDirected) {
      editor.value.replaceGraph(setDirected(graph.value, directed));
    }
  },
);

function withRulesDirection(value: Graph): Graph {
  const directed = directedByRules(rules.value);
  if (directed === null || directed === value.isDirected) {
    return value;
  }
  return setDirected(value, directed);
}

function toggleDirected() {
  if (editor.value !== null) {
    editor.value.replaceGraph(setDirected(graph.value, !graph.value.isDirected));
  }
}

let noticeTimer = 0;

function showNotice(text: string, isError: boolean) {
  notice.value = text;
  noticeIsError.value = isError;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 6000);
}

onBeforeUnmount(() => {
  window.clearTimeout(noticeTimer);
});

function downloadGraph() {
  downloadText(graphFileName(graph.value), graphToFileText(graph.value), "application/json");
  showNotice("Граф сохранён в файл " + graphFileName(graph.value) + ".", false);
}

function downloadSvg() {
  const fileName = imageFileName(graph.value, "svg");
  downloadText(fileName, graphToSvg(graph.value).svg, "image/svg+xml");
  showNotice("Картинка сохранена в файл " + fileName + ".", false);
}

async function downloadPng() {
  const fileName = imageFileName(graph.value, "png");
  const image = graphToSvg(graph.value);
  try {
    const blob = await svgToPng(image.svg, image.width, image.height, 2);
    downloadBlob(fileName, blob);
    showNotice("Картинка сохранена в файл " + fileName + ".", false);
  } catch {
    showNotice("Не получилось сохранить картинку. Попробуйте SVG.", true);
  }
}

function onDownload(id: string) {
  if (id === "json") {
    downloadGraph();
  } else if (id === "png") {
    downloadPng();
  } else if (id === "svg") {
    downloadSvg();
  }
}

function chooseFile() {
  if (fileInput.value !== null) {
    fileInput.value.click();
  }
}

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files !== null ? input.files[0] : undefined;
  input.value = "";
  if (file === undefined || editor.value === null) {
    return;
  }
  const result = graphFromFileText(await file.text());
  if (!result.ok) {
    showNotice(result.error, true);
    return;
  }
  editor.value.replaceGraph(withRulesDirection(result.graph));
  await nextTick();
  editor.value.fitView();
  if (result.skippedEdges > 0) {
    const text = "Граф открыт, но пропущено рёбер: " + result.skippedEdges + ".";
    showNotice(text + " Это повторы или рёбра к несуществующим вершинам.", true);
  } else {
    showNotice("Открыт граф из файла " + file.name + ". Ctrl+Z вернёт прежний.", false);
  }
}

watch(tool, () => {
  notice.value = "";
});

function clearGraph() {
  if (editor.value !== null && graph.value.vertices.length > 0) {
    editor.value.replaceGraph(createEmptyGraph(graph.value.isDirected));
  }
}
</script>

<template>
  <main class="sandbox">
    <h1 class="sandbox__title">Песочница редактора</h1>
    <div v-if="rulesOpen && !viewOnly" class="sandbox__rules">
      <GraphRulesForm v-model="rules" />
    </div>
    <div class="sandbox__stage">
      <GraphEditor
        ref="editor"
        v-model:graph="graph"
        v-model:tool="tool"
        class="sandbox__editor"
        :readonly="viewOnly"
        :rules="rules"
        analysis
      >
        <template #tools>
          <div class="sandbox__tools" role="toolbar" aria-label="Песочница">
            <UiIconButton
              :label="viewOnly ? 'Вернуться к правке' : 'Посмотреть, как увидит студент'"
              :pressed="viewOnly"
              @click="viewOnly = !viewOnly"
            >
              <svg viewBox="0 0 24 24">
                <path d="M2 12 C5 6, 19 6, 22 12 C19 18, 5 18, 2 12 Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </UiIconButton>
            <template v-if="!viewOnly">
              <UiIconButton
                v-if="rules.direction === 'any'"
                :label="directedTitle"
                :pressed="graph.isDirected"
                @click="toggleDirected"
              >
                <svg viewBox="0 0 24 24">
                  <circle cx="5" cy="17" r="2.5" />
                  <path d="M7 15 L17 7" />
                  <path d="M12 6.5 L17.5 6.5 L17.5 12" />
                </svg>
              </UiIconButton>
              <span class="sandbox__divider" aria-hidden="true" />
              <UiIconButton
                label="Правила задачи"
                :pressed="rulesOpen"
                @click="rulesOpen = !rulesOpen"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M4 7 H14 M18 7 H20 M4 17 H8 M12 17 H20" />
                  <circle cx="16" cy="7" r="2" />
                  <circle cx="10" cy="17" r="2" />
                </svg>
              </UiIconButton>
              <UiIconButton
                v-if="rules.canDelete"
                label="Очистить холст"
                :disabled="graph.vertices.length === 0"
                @click="clearGraph"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M5 7 H19 M10 7 V5 H14 V7 M7 7 L8 20 H16 L17 7" />
                </svg>
              </UiIconButton>
              <UiIconButton label="Открыть граф из файла .json" @click="chooseFile">
                <svg viewBox="0 0 24 24">
                  <path d="M3 7 V18 H19 L21 10 H7 L5 18" />
                  <path d="M3 7 H9 L11 9 H17 V10" />
                </svg>
              </UiIconButton>
            </template>
          </div>
          <UiMenuButton
            label="Скачать"
            variant="primary"
            :items="DOWNLOAD_ITEMS"
            @select="onDownload"
          />
        </template>
      </GraphEditor>
      <Transition name="sandbox-notice">
        <p
          v-if="notice !== ''"
          class="sandbox__notice"
          :class="{ 'sandbox__notice--error': noticeIsError }"
          role="status"
        >
          {{ notice }}
        </p>
      </Transition>
    </div>
    <input
      ref="fileInput"
      class="sandbox__file"
      type="file"
      accept=".json,application/json"
      @change="onFileChosen"
    />
  </main>
</template>

<style scoped>
.sandbox {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sandbox__title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.sandbox__stage {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
}

.sandbox__notice {
  position: absolute;
  top: var(--space-4);
  left: 50%;
  z-index: 8;
  max-width: min(520px, calc(100% - 420px));
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  font-size: var(--font-size-sm);
  transform: translateX(-50%);
}

.sandbox__notice--error {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.sandbox-notice-enter-active,
.sandbox-notice-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.sandbox-notice-enter-from,
.sandbox-notice-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

.sandbox__tools {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 44px;
  padding: 3px 5px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.sandbox__divider {
  width: 1px;
  height: 20px;
  margin: 0 var(--space-1);
  background: var(--color-border);
}

.sandbox__file {
  display: none;
}

.sandbox__rules {
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

.sandbox__editor {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
