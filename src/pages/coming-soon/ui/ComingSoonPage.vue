<script setup lang="ts">
import { useRouter } from "vue-router";
import { UiButton } from "@/shared/ui";

const router = useRouter();
</script>

<template>
  <main class="coming-soon">
    <h1 class="coming-soon__title">Раздел скоро появится</h1>
    <p class="coming-soon__text">Мы ещё работаем над этой страницей.</p>
    <UiButton variant="primary" @click="router.push('/')">На главную</UiButton>
  </main>
</template>

<style scoped>
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 100%;
  padding: var(--space-6);
  text-align: center;
}

.coming-soon__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.coming-soon__text {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
