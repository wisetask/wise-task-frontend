<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useUserStore } from "@/entities/user";
import { UiButton, UiTextField } from "@/shared/ui";
import { emptyFilter, emptyListText, loadErrorText, type TaskFilter } from "../model/taskList";
import { useTaskList } from "../model/useTaskList";

const userStore = useUserStore();
const { tasks, totalCount, hasNext, loading, error, search, loadMore } = useTaskList();

const filter = ref<TaskFilter>(emptyFilter());
const appliedFilter = ref<TaskFilter>(emptyFilter());

const canCreate = computed(() => {
  const user = userStore.user;
  return user !== null && (user.role === "AUTHOR" || user.role === "ADMIN");
});

const countText = computed(() => {
  if (totalCount.value === null) {
    return "";
  }
  return "Найдено: " + totalCount.value;
});

function onSearch() {
  appliedFilter.value = { name: filter.value.name, category: filter.value.category };
  search(appliedFilter.value);
}

function onReset() {
  filter.value = emptyFilter();
  onSearch();
}

function onLoadMore() {
  loadMore(appliedFilter.value);
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <main class="tasks">
    <header class="tasks__header">
      <h1 class="tasks__title">Задачи</h1>
      <RouterLink v-if="canCreate" class="tasks__create" :to="{ name: 'constructor' }">
        Создать задачу
      </RouterLink>
    </header>

    <form class="tasks__filter" role="search" @submit.prevent="onSearch">
      <UiTextField
        v-model="filter.name"
        label="Название"
        placeholder="Например, «Остовное дерево»"
      />
      <UiTextField v-model="filter.category" label="Категория" placeholder="Например, «Деревья»" />
      <div class="tasks__filter-actions">
        <UiButton type="submit" variant="primary">Найти</UiButton>
        <UiButton type="button" variant="ghost" @click="onReset">Сбросить</UiButton>
      </div>
    </form>

    <p v-if="countText !== '' && error === null" class="tasks__count">{{ countText }}</p>

    <div v-if="error !== null" class="tasks__message tasks__message--error" role="alert">
      <span>{{ loadErrorText(error) }}</span>
      <UiButton size="sm" @click="onSearch">Повторить</UiButton>
    </div>
    <p v-else-if="loading && tasks.length === 0" class="tasks__message">Загружаю задачи…</p>
    <p v-else-if="tasks.length === 0" class="tasks__message">{{ emptyListText(appliedFilter) }}</p>

    <ul v-if="tasks.length > 0" class="tasks__list">
      <li v-for="task in tasks" :key="task.id">
        <RouterLink class="tasks__card" :to="{ name: 'task', params: { id: task.id } }">
          <span class="tasks__card-category">{{ task.category }}</span>
          <span class="tasks__card-name">{{ task.name }}</span>
          <span v-if="task.description !== ''" class="tasks__card-description">
            {{ task.description }}
          </span>
          <span class="tasks__card-meta">
            <span v-if="task.author !== ''">{{ task.author }}</span>
            <span v-if="!task.isPublic" class="tasks__card-hidden">Видна не всем</span>
          </span>
        </RouterLink>
      </li>
    </ul>

    <UiButton
      v-if="hasNext && error === null"
      class="tasks__more"
      :loading="loading"
      @click="onLoadMore"
    >
      Показать ещё
    </UiButton>
  </main>
</template>

<style scoped>
.tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 880px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
}

.tasks__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.tasks__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.tasks__create {
  margin-left: auto;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--font-size-md);
  text-decoration: none;
}

.tasks__create:hover {
  background: var(--color-accent-hover);
}

.tasks__create:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.tasks__filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
}

.tasks__filter > :not(.tasks__filter-actions) {
  flex: 1 1 220px;
}

.tasks__filter-actions {
  display: flex;
  gap: var(--space-2);
}

.tasks__count {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.tasks__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.tasks__message--error {
  border-style: solid;
  background: var(--graph-red-fill);
  color: var(--color-text);
}

.tasks__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tasks__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
}

.tasks__card:hover {
  border-color: var(--color-accent);
}

.tasks__card:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.tasks__card-category {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.tasks__card-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.tasks__card-description {
  line-height: 1.5;
}

.tasks__card-meta {
  display: flex;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.tasks__card-hidden {
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
}

.tasks__more {
  align-self: center;
}
</style>
