<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <main class="not-found">
    <h1>Страница не найдена</h1>
    <RouterLink to="/">На главную</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  padding: 32px;
}
</style>
