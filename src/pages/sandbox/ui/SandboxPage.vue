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
import { UiButton, UiCheckbox, UiMenuButton, type UiMenuItem } from "@/shared/ui";
import {
  GraphEditor,
  graphToSvg,
  imageFileName,
  toolHint,
  type EditorTool,
} from "@/widgets/graph-editor";
import { browserStorage, loadGraph, saveGraph } from "../lib/savedGraph";

const storage = browserStorage();
const savedGraph = loadGraph(storage);
const graph = ref<Graph>(savedGraph === null ? createEmptyGraph(false) : savedGraph);
const tool = ref<EditorTool>("vertex");
const viewOnly = ref(false);
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const notice = ref("");
const noticeIsError = ref(false);

const DOWNLOAD_ITEMS: UiMenuItem[] = [
  { id: "json", label: "Граф (.json)", hint: "Файл, который потом можно открыть здесь" },
  { id: "png", label: "Картинка PNG", hint: "Для отчёта или презентации" },
  { id: "svg", label: "Картинка SVG", hint: "Векторная, не теряет чёткость" },
];

const hint = computed(() => toolHint(tool.value, viewOnly.value));

watch(graph, (value) => {
  saveGraph(storage, value);
});

function onDirectedChange(isDirected: boolean) {
  if (editor.value !== null) {
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
  editor.value.replaceGraph(result.graph);
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
      <h1 class="sandbox__title">Песочница редактора</h1>
      <span
        v-if="notice !== ''"
        class="sandbox__hint"
        :class="{ 'sandbox__hint--error': noticeIsError }"
        role="status"
      >
        {{ notice }}
      </span>
      <span v-else class="sandbox__hint">{{ hint }}</span>
      <UiCheckbox v-model="viewOnly" class="sandbox__toggle" label="Только просмотр" />
      <template v-if="!viewOnly">
        <UiCheckbox
          class="sandbox__nowrap"
          :model-value="graph.isDirected"
          label="Ориентированный"
          @update:model-value="onDirectedChange"
        />
        <UiButton size="sm" @click="clearGraph">Очистить</UiButton>
        <UiButton
          size="sm"
          class="sandbox__nowrap"
          title="Открыть граф из файла .json, скачанного здесь раньше"
          @click="chooseFile"
        >
          Открыть граф (.json)
        </UiButton>
      </template>
      <UiMenuButton label="Скачать" size="sm" :items="DOWNLOAD_ITEMS" @select="onDownload" />
      <input
        ref="fileInput"
        class="sandbox__file"
        type="file"
        accept=".json,application/json"
        @change="onFileChosen"
      />
    </header>
    <GraphEditor
      ref="editor"
      v-model:graph="graph"
      v-model:tool="tool"
      class="sandbox__editor"
      :readonly="viewOnly"
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
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.sandbox__title {
  margin: 0;
  font-size: var(--font-size-lg);
  white-space: nowrap;
}

.sandbox__hint {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sandbox__hint--error {
  color: var(--color-danger);
}

.sandbox__file {
  display: none;
}

.sandbox__toggle {
  margin-left: auto;
  white-space: nowrap;
}

.sandbox__nowrap {
  white-space: nowrap;
}

.sandbox__editor {
  flex: 1;
  min-height: 0;
}
</style>
