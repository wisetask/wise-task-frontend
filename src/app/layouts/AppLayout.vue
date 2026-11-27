<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { RouterView, useRouter, type RouteLocationNormalizedLoaded } from "vue-router";
import { useUserStore } from "@/entities/user";
import { AppHeader } from "@/widgets/app-header";

const PROGRESS_HIDE = 450;

const userStore = useUserStore();
const router = useRouter();
const progress = ref("");
const progressKey = ref(0);
let progressTimer = 0;

function pageKey(route: RouteLocationNormalizedLoaded): string {
  if (route.meta.samePage === true) {
    return String(route.name);
  }
  return route.path;
}

async function onSignOut() {
  await userStore.logOut();
  router.push({ name: "sign-in" });
}

const stopBefore = router.beforeEach((to, from) => {
  if (to.path !== from.path) {
    window.clearTimeout(progressTimer);
    progressKey.value = progressKey.value + 1;
    progress.value = "run";
  }
  return true;
});

const stopAfter = router.afterEach(() => {
  if (progress.value !== "run") {
    return;
  }
  progress.value = "done";
  progressTimer = window.setTimeout(() => {
    progress.value = "";
  }, PROGRESS_HIDE);
});

onBeforeUnmount(() => {
  stopBefore();
  stopAfter();
  window.clearTimeout(progressTimer);
});
</script>

<template>
  <div class="app-layout">
    <AppHeader :user="userStore.user" @sign-out="onSignOut" />
    <span
      v-if="progress !== ''"
      :key="progressKey"
      class="app-layout__progress"
      :class="'app-layout__progress--' + progress"
      aria-hidden="true"
    />
    <!-- Не <main>: на самих страницах он уже есть -->
    <div class="app-layout__page">
      <RouterView v-slot="{ Component, route }">
        <Transition name="app-page" mode="out-in">
          <component :is="Component" :key="pageKey(route)" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  position: relative;
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

.app-layout__progress {
  position: absolute;
  top: var(--header-height);
  left: 0;
  z-index: 11;
  width: 0;
  height: 2px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(90deg, var(--color-accent), var(--graph-active));
  box-shadow: 0 0 8px var(--color-accent);
  pointer-events: none;
}

.app-layout__progress--run {
  animation: app-progress-run 900ms var(--ease-out) forwards;
}

.app-layout__progress--done {
  width: 100%;
  opacity: 0;
  transition:
    width 200ms var(--ease-out),
    opacity 250ms ease-out 200ms;
}

.app-page-enter-active {
  transition:
    opacity 280ms var(--ease-out),
    transform 380ms var(--ease-spring);
}

.app-page-leave-active {
  transition:
    opacity 140ms var(--ease-out),
    transform 140ms var(--ease-out);
}

.app-page-enter-from {
  opacity: 0;
  transform: translateY(18px);
}

.app-page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes app-progress-run {
  from {
    width: 0;
  }
  to {
    width: 75%;
  }
}
</style>
