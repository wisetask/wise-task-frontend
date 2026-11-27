<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { SignInForm, getRedirectPath } from "@/features/auth-by-email";
import { motionAllowed } from "@/shared/lib/motion";
import { AuthLayout } from "@/widgets/auth-scene";

const route = useRoute();
const router = useRouter();

const progress = ref(0);
const state = ref<"idle" | "error" | "success">("idle");
let stateTimer = 0;

function onFailed() {
  state.value = "error";
  window.clearTimeout(stateTimer);
  stateTimer = window.setTimeout(() => {
    state.value = "idle";
  }, 700);
}

function onSuccess() {
  state.value = "success";
  window.clearTimeout(stateTimer);
  const delay = motionAllowed() ? 650 : 0;
  stateTimer = window.setTimeout(() => {
    router.push(getRedirectPath(route.query.redirect));
  }, delay);
}

onBeforeUnmount(() => {
  window.clearTimeout(stateTimer);
});
</script>

<template>
  <AuthLayout
    title="Вход"
    subtitle="С возвращением! Граф соскучился."
    :progress="progress"
    :state="state"
  >
    <SignInForm @progress="progress = $event" @failed="onFailed" @success="onSuccess" />
    <template #footer>
      Нет аккаунта?
      <RouterLink :to="{ name: 'sign-up', query: route.query }">Зарегистрироваться</RouterLink>
    </template>
  </AuthLayout>
</template>
