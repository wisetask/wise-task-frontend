<script setup lang="ts">
import { computed, ref } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { pluginFitsTask, type GraphType, type Plugin } from "../model/plugin";

const props = defineProps<{ plugins: readonly Plugin[]; graphType: GraphType }>();
const emit = defineEmits<{ pick: [plugin: Plugin] }>();
const search = ref("");

const groups = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const categories = new Map<string, Plugin[]>();
  for (const plugin of props.plugins) {
    if (!pluginFitsTask(plugin, props.graphType)) {
      continue;
    }
    if (
      !plugin.name.toLocaleLowerCase().includes(query) &&
      !plugin.description.toLocaleLowerCase().includes(query)
    ) {
      continue;
    }
    const category = categories.get(plugin.category);
    if (category === undefined) {
      categories.set(plugin.category, [plugin]);
    } else {
      category.push(plugin);
    }
  }
  return [...categories];
});
</script>

<template>
  <div class="picker">
    <UiTextField v-model="search" label="Поиск плагинов" />
    <p v-if="groups.length === 0" class="description">Подходящих плагинов нет</p>
    <div v-for="[category, categoryPlugins] in groups" :key="category">
      <h3>{{ category }}</h3>
      <ul class="plugins">
        <li v-for="plugin in categoryPlugins" :key="plugin.id" class="plugin">
          <div>
            <strong>{{ plugin.name }}</strong>
            <p class="description">{{ plugin.description }}</p>
          </div>
          <UiButton
            size="sm"
            :aria-label="'Добавить: ' + plugin.name"
            @click="emit('pick', plugin)"
          >
            Добавить
          </UiButton>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.picker,
.plugins {
  display: grid;
  gap: var(--space-2);
}

h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-md);
}

.plugins {
  margin: 0;
  padding: 0;
  list-style: none;
}

.plugin {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.description {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
