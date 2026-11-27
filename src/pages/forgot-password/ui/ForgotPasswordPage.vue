<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { RouterLink } from "vue-router";
import { ForgotPasswordForm } from "@/features/auth-by-email";
import { AuthLayout } from "@/widgets/auth-scene";

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
  window.clearTimeout(stateTimer);
  state.value = "success";
}

onBeforeUnmount(() => {
  window.clearTimeout(stateTimer);
});
</script>

<template>
  <AuthLayout
    title="Восстановление пароля"
    subtitle="Бывает. Пришлём ссылку на почту."
    :progress="progress"
    :state="state"
  >
    <ForgotPasswordForm @progress="progress = $event" @failed="onFailed" @success="onSuccess" />
    <template #footer>
      Вспомнили пароль?
      <RouterLink :to="{ name: 'sign-in' }">Войти</RouterLink>
    </template>
  </AuthLayout>
</template>
