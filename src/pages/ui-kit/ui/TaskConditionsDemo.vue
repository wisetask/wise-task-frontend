<script setup lang="ts">
import { ref } from "vue";
import {
  addCondition,
  conditionFromPlugin,
  PluginPicker,
  TaskConditionsEditor,
  usePlugins,
  type Plugin,
  type TaskCondition,
} from "@/features/task-conditions";
import { UiButton } from "@/shared/ui";

const conditions = ref<TaskCondition[]>([]);
const loadCatalog = ref(false);
const { plugins, loading, error } = usePlugins(loadCatalog);
const demoPlugins: Plugin[] = [
  {
    id: "connected",
    name: "Граф связный",
    description: "Граф должен быть связным",
    category: "Свойства",
    graphType: "UNDIRECT",
    pluginType: "GRAPH_PROPERTY",
    isValid: true,
  },
  {
    id: "vertices",
    name: "Число вершин",
    description: "Проверьте число вершин",
    category: "Характеристики",
    graphType: "ANY",
    pluginType: "GRAPH_CHARACTERISTIC",
    isValid: true,
  },
  {
    id: "reverse",
    name: "Обратный граф",
    description: "Проверьте направления рёбер",
    category: "Преобразования",
    graphType: "DIRECT",
    pluginType: "GRAPH_NEW_GRAPH",
    isValid: true,
  },
  {
    id: "degrees",
    name: "Последовательность степеней",
    description: "Проверьте степени вершин",
    category: "Характеристики",
    graphType: "ANY",
    pluginType: "GRAPH_STRING",
    isValid: true,
  },
];

function addPlugin(plugin: Plugin) {
  conditions.value = addCondition(conditions.value, conditionFromPlugin(plugin));
}
</script>

<template>
  <div class="demo">
    <div>
      <UiButton v-if="!loadCatalog" @click="loadCatalog = true"
        >Загрузить каталог с сервера</UiButton
      >
      <p v-if="loading" role="status">Загружаем плагины…</p>
      <p v-if="error" role="alert">Не удалось загрузить каталог: {{ error.message }}</p>
    </div>
    <PluginPicker
      :plugins="loadCatalog ? plugins : demoPlugins"
      graph-type="ANY"
      @pick="addPlugin"
    />
    <TaskConditionsEditor v-model="conditions" />
  </div>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--space-4);
}
</style>
