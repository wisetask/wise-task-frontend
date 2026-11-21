<script setup lang="ts">
import { RouterView, useRouter } from "vue-router";
import { useUserStore } from "@/entities/user";
import { AppHeader } from "@/widgets/app-header";

const userStore = useUserStore();
const router = useRouter();

async function onSignOut() {
  await userStore.logOut();
  router.push({ name: "sign-in" });
}
</script>

<template>
  <div class="app-layout">
    <AppHeader :user="userStore.user" @sign-out="onSignOut" />
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
