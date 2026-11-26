<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
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
import {
  UiButton,
  UiMenuButton,
  UiSegmented,
  type UiMenuItem,
  type UiSegmentedOption,
} from "@/shared/ui";
import {
  allowEverything,
  directedByRules,
  GraphEditor,
  GraphRulesForm,
  graphToSvg,
  imageFileName,
  toolHint,
  type EditorRules,
  type EditorTool,
} from "@/widgets/graph-editor";
import { browserStorage, loadGraph, saveGraph } from "../lib/savedGraph";

const storage = browserStorage();
const savedGraph = loadGraph(storage);
const graph = ref<Graph>(savedGraph === null ? createEmptyGraph(false) : savedGraph);
const tool = ref<EditorTool>("vertex");
const mode = ref("edit");
const viewOnly = computed(() => mode.value === "view");
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

const MODE_OPTIONS: UiSegmentedOption[] = [
  { value: "edit", label: "Правка" },
  { value: "view", label: "Просмотр" },
];

const DIRECTION_OPTIONS: UiSegmentedOption[] = [
  { value: "undirected", label: "Неориентированный" },
  { value: "directed", label: "Ориентированный" },
];

const direction = computed(() => (graph.value.isDirected ? "directed" : "undirected"));

const hint = computed(() => toolHint(tool.value, viewOnly.value));

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

function onDirectionChoose(value: string) {
  const isDirected = value === "directed";
  if (editor.value !== null && isDirected !== graph.value.isDirected) {
    editor.value.replaceGraph(setDirected(graph.value, isDirected));
  }
}

function showNotice(text: string, isError: boolean) {
  notice.value = text;
  noticeIsError.value = isError;
}

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
    <header class="sandbox__header">
      <div class="sandbox__heading">
        <h1 class="sandbox__title">Песочница редактора</h1>
        <p
          v-if="notice !== ''"
          class="sandbox__hint"
          :class="{ 'sandbox__hint--error': noticeIsError }"
          role="status"
        >
          {{ notice }}
        </p>
        <p v-else :key="hint" class="sandbox__hint">{{ hint }}</p>
      </div>
      <div class="sandbox__controls">
        <UiSegmented v-model="mode" :options="MODE_OPTIONS" label="Режим редактора" />
        <UiSegmented
          v-if="!viewOnly && rules.direction === 'any'"
          :model-value="direction"
          :options="DIRECTION_OPTIONS"
          label="Тип графа"
          @update:model-value="onDirectionChoose"
        />
        <span class="sandbox__divider" aria-hidden="true" />
        <template v-if="!viewOnly">
          <UiButton
            size="sm"
            variant="ghost"
            :aria-expanded="rulesOpen"
            title="Проверить, как редактор ведёт себя с ограничениями задачи"
            @click="rulesOpen = !rulesOpen"
          >
            Правила задачи
          </UiButton>
          <UiButton v-if="rules.canDelete" size="sm" variant="ghost" @click="clearGraph">
            Очистить
          </UiButton>
          <UiButton
            size="sm"
            title="Открыть граф из файла .json, скачанного здесь раньше"
            @click="chooseFile"
          >
            Открыть .json
          </UiButton>
        </template>
        <UiMenuButton label="Скачать" size="sm" :items="DOWNLOAD_ITEMS" @select="onDownload" />
      </div>
      <input
        ref="fileInput"
        class="sandbox__file"
        type="file"
        accept=".json,application/json"
        @change="onFileChosen"
      />
    </header>
    <div v-if="rulesOpen && !viewOnly" class="sandbox__rules">
      <GraphRulesForm v-model="rules" />
    </div>
    <GraphEditor
      ref="editor"
      v-model:graph="graph"
      v-model:tool="tool"
      class="sandbox__editor"
      :readonly="viewOnly"
      :rules="rules"
      analysis
    />
  </main>
</template>

<style scoped>
.sandbox {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sandbox__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.sandbox__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sandbox__title {
  margin: 0;
  font-size: var(--font-size-lg);
  white-space: nowrap;
}

.sandbox__hint {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: sandbox-hint-in var(--duration) var(--ease-out);
}

.sandbox__hint--error {
  color: var(--color-danger);
}

.sandbox__controls {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-2);
}

.sandbox__divider {
  width: 1px;
  height: 24px;
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
  min-height: 0;
}

@keyframes sandbox-hint-in {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
