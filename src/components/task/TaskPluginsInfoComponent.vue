<template>
  <div class="task-block">
    <button type="button" class="task-block__header task-block__header--button" @click="toggle">
      <span class="task-block__icon">
        <v-icon size="20" icon="mdi-puzzle-outline" />
      </span>
      <span class="task-block__titles">
        <span class="task-block__title">Плагины задачи</span>
        <span class="task-block__subtitle">{{ headerSubtitle }}</span>
      </span>
      <v-chip v-if="plugins.length" size="x-small" color="blue" variant="flat" class="task-plugins-panel__count">
        {{ plugins.length }}
      </v-chip>
      <v-icon
        class="task-plugins-panel__chevron"
        :class="{ 'task-plugins-panel__chevron--open': isExpanded }"
        icon="mdi-chevron-down"
      />
    </button>

    <v-expand-transition>
      <div v-show="isExpanded" class="task-block__body">
        <div v-if="taskAuthor" class="task-block__row task-plugins-panel__row">
          <v-avatar size="36" :color="taskAuthorColor" class="text-uppercase text-caption font-weight-bold">
            {{ taskAuthorInitials }}
          </v-avatar>
          <div class="task-plugins-panel__info">
            <div class="task-block__label">Автор задачи</div>
            <div class="task-plugins-panel__name">{{ formatFullName(taskAuthor) }}</div>
            <div class="task-plugins-panel__muted">{{ taskAuthor.email }}</div>
          </div>
        </div>

        <template v-if="plugins.length">
          <div class="task-block__label task-plugins-panel__section">Используемые плагины</div>
          <div v-for="plugin in plugins" :key="plugin.id" class="task-block__row task-plugins-panel__row">
            <span
              class="task-plugins-panel__plugin-icon"
              :style="{ backgroundColor: pluginTypeColor(plugin.pluginType) }"
            >
              <v-icon size="16" icon="mdi-puzzle-outline" />
            </span>
            <div class="task-plugins-panel__info">
              <div class="task-plugins-panel__name">{{ plugin.name || "Без названия" }}</div>
              <div class="task-plugins-panel__muted">
                <v-icon size="12" icon="mdi-account-outline" />
                {{ plugin.author ? formatFullName(plugin.author) : "автор не указан" }}
              </div>
            </div>
            <v-chip size="x-small" variant="tonal" :color="pluginTypeChipColor(plugin.pluginType)">
              {{ pluginTypeLabel(plugin.pluginType) }}
            </v-chip>
          </div>
        </template>
        <div v-else class="task-block__empty">В задаче нет плагинов</div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { PluginType } from "@/__generated__/graphql";

interface PluginAuthor {
  firstName?: string | null;
  lastName?: string | null;
  patronymic?: string | null;
  email?: string | null;
}

interface TaskPluginItem {
  id: string;
  name?: string | null;
  pluginType?: string | null;
  author?: PluginAuthor | null;
}

const props = withDefaults(
  defineProps<{
    taskAuthor?: PluginAuthor | null;
    plugins?: TaskPluginItem[];
  }>(),
  {
    taskAuthor: null,
    plugins: () => [],
  },
);

const isExpanded = ref(false);

const AVATAR_COLORS = ["#1976d2", "#26a69a", "#ef6c00", "#8e24aa", "#43a047", "#f06292", "#6d4c41", "#1e88e5"];

const PLUGIN_TYPE_META: Record<string, { label: string; color: string }> = {
  [PluginType.GraphCharacteristic]: { label: "Характеристика графа", color: "blue" },
  [PluginType.GraphProperty]: { label: "Свойство графа", color: "teal" },
  [PluginType.GraphNewGraph]: { label: "Новый граф", color: "deep-orange" },
  [PluginType.GraphString]: { label: "Строковый", color: "purple" },
};

const colorFromString = (value: string): string => {
  const hash = [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatFullName = (author?: PluginAuthor | null): string => {
  if (!author) return "—";
  const fullName = [author.lastName, author.firstName, author.patronymic]
    .filter((part) => part && part.length > 0)
    .join(" ");
  return fullName || author.email || "—";
};

const getInitials = (author?: PluginAuthor | null): string => {
  const lastName = author?.lastName?.trim();
  const firstName = author?.firstName?.trim();
  const initials = `${lastName?.[0] ?? ""}${firstName?.[0] ?? ""}`;
  return initials ? initials : "?";
};

const taskAuthorInitials = computed(() => getInitials(props.taskAuthor));
const taskAuthorColor = computed(() =>
  colorFromString(props.taskAuthor?.email ?? props.taskAuthor?.lastName ?? "task"),
);

const headerSubtitle = computed(() =>
  props.taskAuthor
    ? `Автор задачи: ${formatFullName(props.taskAuthor)}`
    : "Автор задачи не указан",
);

const pluginTypeMeta = (pluginType?: string | null) =>
  (pluginType && PLUGIN_TYPE_META[pluginType]) || { label: "Плагин", color: "grey" };

const pluginTypeLabel = (pluginType?: string | null) => pluginTypeMeta(pluginType).label;
const pluginTypeChipColor = (pluginType?: string | null) => pluginTypeMeta(pluginType).color;
const pluginTypeColor = (pluginType?: string | null) => {
  const colors: Record<string, string> = {
    [PluginType.GraphCharacteristic]: "#e3f2fd",
    [PluginType.GraphProperty]: "#e0f2f1",
    [PluginType.GraphNewGraph]: "#fff3e0",
    [PluginType.GraphString]: "#f3e5f5",
  };
  return colors[pluginType ?? ""] ?? "#eceff1";
};

const toggle = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<style>
@import "./taskViewStyles.css";
</style>
<style scoped>
.task-plugins-panel__count {
  flex-shrink: 0;
}

.task-plugins-panel__chevron {
  color: #1976d2;
  transition: transform 0.2s ease;
}

.task-plugins-panel__chevron--open {
  transform: rotate(180deg);
}

.task-plugins-panel__section {
  margin: 12px 2px 6px;
}

.task-plugins-panel__row {
  margin-bottom: 6px;
}

.task-plugins-panel__row:last-child {
  margin-bottom: 0;
}

.task-plugins-panel__info {
  flex-grow: 1;
  min-width: 0;
}

.task-plugins-panel__name {
  font-size: 13px;
  font-weight: 600;
  color: #263238;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-plugins-panel__muted {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #78909c;
}

.task-plugins-panel__plugin-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #37474f;
  flex-shrink: 0;
}
</style>
