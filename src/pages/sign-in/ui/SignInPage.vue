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
      <p class="sign-in__footer-line">
        <RouterLink :to="{ name: 'forgot-password' }">Забыли пароль?</RouterLink>
      </p>
      <p class="sign-in__footer-line">
        Нет аккаунта?
        <RouterLink :to="{ name: 'sign-up', query: route.query }">Зарегистрироваться</RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>

<style scoped>
.sign-in__footer-line {
  margin: 0;
}

.sign-in__footer-line + .sign-in__footer-line {
  margin-top: var(--space-2);
}
</style>
