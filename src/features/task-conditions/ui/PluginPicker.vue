<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { UiTextField } from "@/shared/ui";
import { pluginFitsTask, type GraphType, type Plugin, type PluginType } from "../model/plugin";
import { pluginCategories, pluginTypeHint, pluginTypeTitle, usedText } from "../model/pluginType";
import PluginTypeIcon from "./PluginTypeIcon.vue";

const props = withDefaults(
  defineProps<{
    plugins: readonly Plugin[];
    graphType: GraphType;
    used?: Record<string, number>;
  }>(),
  {
    used: () => ({}),
  },
);
const emit = defineEmits<{ pick: [plugin: Plugin] }>();
const search = ref("");
const category = ref("");
const addedId = ref("");
let addedTimer = 0;

interface PickerItem {
  plugin: Plugin;
  index: number;
}

interface PickerGroup {
  category: string;
  items: PickerItem[];
}

const fitting = computed(() => {
  const list: Plugin[] = [];
  for (const plugin of props.plugins) {
    if (pluginFitsTask(plugin, props.graphType)) {
      list.push(plugin);
    }
  }
  return list;
});

const categories = computed(() => pluginCategories(fitting.value));

const groups = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  const result: PickerGroup[] = [];
  let index = 0;
  for (const plugin of fitting.value) {
    if (category.value !== "" && plugin.category !== category.value) {
      continue;
    }
    if (
      !plugin.name.toLocaleLowerCase().includes(query) &&
      !plugin.description.toLocaleLowerCase().includes(query)
    ) {
      continue;
    }
    let group: PickerGroup | null = null;
    for (const existing of result) {
      if (existing.category === plugin.category) {
        group = existing;
      }
    }
    if (group === null) {
      group = { category: plugin.category, items: [] };
      result.push(group);
    }
    group.items.push({ plugin: plugin, index: index });
    index = index + 1;
  }
  return result;
});

function usedCount(plugin: Plugin): number {
  const count = props.used[plugin.id];
  return count === undefined ? 0 : count;
}

function typeClass(type: PluginType): string {
  if (type === "GRAPH_CHARACTERISTIC") {
    return "picker__plugin--number";
  }
  if (type === "GRAPH_NEW_GRAPH") {
    return "picker__plugin--graph";
  }
  if (type === "GRAPH_STRING") {
    return "picker__plugin--string";
  }
  return "picker__plugin--property";
}

function itemStyle(item: PickerItem): Record<string, string> {
  return { "--index": String(Math.min(item.index, 12)) };
}

function pick(plugin: Plugin) {
  emit("pick", plugin);
  addedId.value = plugin.id;
  window.clearTimeout(addedTimer);
  addedTimer = window.setTimeout(() => {
    addedId.value = "";
  }, 900);
}

onBeforeUnmount(() => {
  window.clearTimeout(addedTimer);
});
</script>

<template>
  <div class="picker">
    <UiTextField v-model="search" label="Поиск плагинов" />
    <div v-if="categories.length > 1" class="picker__chips" role="group" aria-label="Категории">
      <button
        type="button"
        class="picker__chip"
        :aria-pressed="category === ''"
        @click="category = ''"
      >
        Все
      </button>
      <button
        v-for="name in categories"
        :key="name"
        type="button"
        class="picker__chip"
        :aria-pressed="category === name"
        @click="category = category === name ? '' : name"
      >
        {{ name }}
      </button>
    </div>
    <p v-if="groups.length === 0" class="picker__empty">Подходящих плагинов нет</p>
    <section v-for="group in groups" :key="group.category" class="picker__group">
      <h3 class="picker__category">{{ group.category }}</h3>
      <ul class="picker__plugins">
        <li
          v-for="item in group.items"
          :key="item.plugin.id"
          class="picker__plugin"
          :class="[
            typeClass(item.plugin.pluginType),
            { 'picker__plugin--added': addedId === item.plugin.id },
          ]"
          :style="itemStyle(item)"
        >
          <span class="picker__type" :title="pluginTypeHint(item.plugin.pluginType)">
            <PluginTypeIcon :type="item.plugin.pluginType" />
          </span>
          <div class="picker__text">
            <span class="picker__name">{{ item.plugin.name }}</span>
            <span class="picker__description">{{ item.plugin.description }}</span>
            <span class="picker__meta">
              {{ pluginTypeTitle(item.plugin.pluginType) }}
              <span v-if="usedCount(item.plugin) > 0" class="picker__used">
                {{ usedText(usedCount(item.plugin)) }}
              </span>
            </span>
          </div>
          <button
            type="button"
            class="picker__add"
            :aria-label="'Добавить: ' + item.plugin.name"
            :title="'Добавить: ' + item.plugin.name"
            @click="pick(item.plugin)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path v-if="addedId === item.plugin.id" d="M6 12.5 L10 16.5 L18 8" />
              <path v-else d="M12 6 V18 M6 12 H18" />
            </svg>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  gap: var(--space-3);
}

.picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.picker__chip {
  min-height: 28px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.picker__chip:hover {
  color: var(--color-text);
}

.picker__chip[aria-pressed="true"] {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font-weight: 600;
}

.picker__chip:focus-visible,
.picker__add:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.picker__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.picker__group {
  display: grid;
  gap: var(--space-2);
}

.picker__category {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.picker__plugins {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.picker__plugin {
  --type: var(--color-success);

  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition:
    border-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
  animation: picker-in 420ms var(--ease-out) calc(var(--index) * 40ms) backwards;
}

.picker__plugin:hover {
  border-color: color-mix(in srgb, var(--type) 45%, var(--color-border));
  box-shadow: var(--shadow-popover);
  transform: translateY(-1px);
}

.picker__plugin--number {
  --type: var(--color-accent);
}

.picker__plugin--graph {
  --type: var(--graph-active);
}

.picker__plugin--string {
  --type: color-mix(in oklch, var(--color-accent), var(--color-danger));
}

.picker__plugin--added::after {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  content: "";
  pointer-events: none;
  animation: picker-added 700ms var(--ease-out) forwards;
}

.picker__type {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--type) 14%, transparent);
  color: var(--type);
}

.picker__text {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
}

.picker__name {
  font-weight: 600;
}

.picker__description {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.picker__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  color: var(--type);
  font-size: 12px;
  font-weight: 600;
}

.picker__used {
  padding: 1px var(--space-2);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-weight: 500;
}

.picker__add {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.picker__add:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
  transform: scale(1.08);
}

.picker__add:active {
  transform: scale(0.92);
}

.picker__plugin--added .picker__add {
  background: var(--color-success);
  color: var(--color-on-accent);
  animation: picker-pop 420ms var(--ease-spring);
}

.picker__add svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes picker-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes picker-added {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-success) 45%, transparent);
  }
  100% {
    box-shadow: 0 0 0 12px transparent;
  }
}

@keyframes picker-pop {
  0% {
    transform: scale(0.7) rotate(-30deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}
</style>
