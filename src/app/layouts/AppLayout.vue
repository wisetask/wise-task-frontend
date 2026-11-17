<script setup lang="ts">
import { ref } from "vue";
import { RouterView } from "vue-router";
import { AppHeader } from "@/widgets/app-header";
import type { HeaderUser } from "@/widgets/app-header";

// ВРЕМЕННО, пока не влит T08 (вход): тестовый пользователь.
// Поменяйте role на USER, AUTHOR или null, чтобы проверить разные шапки.
const user = ref<HeaderUser | null>({
  firstName: "Иван",
  lastName: "Петров",
  email: "test@test.ru",
  role: "ADMIN",
});

function onSignOut() {
  user.value = null;
}
</script>

<template>
  <div class="app-layout">
    <AppHeader :user="user" @sign-out="onSignOut" />
    <!-- Не <main>: на самих страницах он уже есть -->
    <div class="app-layout__page">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* min-height: 0 нужен, иначе песочница на 100% высоты вылезет за экран.
   Длинные страницы (например /ui-kit) прокручиваются внутри, шапка остаётся на месте. */
.app-layout__page {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
