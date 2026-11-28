<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UiButton } from "@/shared/ui";
import { forbiddenText } from "../lib/forbiddenText";

const route = useRoute();
const router = useRouter();

// Guard передаёт в ?from адрес страницы, на которую не пустил. По её пометкам пишем, кому она доступна
const text = computed(() => {
  const from = route.query.from;
  if (typeof from !== "string") {
    return forbiddenText(undefined);
  }
  return forbiddenText(router.resolve(from).meta.roles);
});
</script>

<template>
  <main class="forbidden">
    <h1 class="forbidden__title">Нет доступа</h1>
    <p class="forbidden__text">{{ text }}</p>
    <UiButton variant="primary" @click="router.push('/')">На главную</UiButton>
  </main>
</template>

<style scoped>
.forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 100%;
  padding: var(--space-6);
  text-align: center;
}

.forbidden__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.forbidden__text {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
