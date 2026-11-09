<template>
  <div class="task-block">
    <div class="task-block__header">
      <span class="task-block__icon">
        <v-icon size="20" icon="mdi-text-box-outline" />
      </span>
      <span class="task-block__titles">
        <span class="task-block__title">Описание задачи</span>
      </span>
    </div>
    <div class="task-block__body task-description-panel__body" v-html="formattedDescription" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    description?: string | null;
  }>(),
  {
    description: "",
  },
);

const formattedDescription = computed(() => {
  const description = props.description ?? "";
  if (!description) {
    return "Описание отсутствует";
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return description.replace(urlRegex, (url) => {
    const escapedUrl = url
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
  });
});
</script>

<style>
@import "./taskViewStyles.css";
</style>
<style scoped>
.task-description-panel__body {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.55;
  color: #37474f;
}

.task-description-panel__body :deep(a) {
  color: #1976d2;
  font-weight: 500;
  word-break: break-all;
}
</style>
