<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ResetPasswordForm } from "@/features/auth-by-email";
import { motionAllowed } from "@/shared/lib/motion";
import { AuthLayout } from "@/widgets/auth-scene";

const route = useRoute();
const router = useRouter();

// Токен приходит в ссылке из письма: ...?token=<uuid>
const recoveryToken = computed(() => {
  const token = route.query.token;
  return typeof token === "string" ? token : "";
});

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
    router.push("/");
  }, delay);
}

onBeforeUnmount(() => {
  window.clearTimeout(stateTimer);
});
</script>

<template>
  <AuthLayout
    title="Новый пароль"
    subtitle="Придумайте пароль — и сразу войдёте."
    :progress="progress"
    :state="state"
  >
    <ResetPasswordForm
      v-if="recoveryToken"
      :recovery-token="recoveryToken"
      @progress="progress = $event"
      @failed="onFailed"
      @success="onSuccess"
    />
    <p v-else class="reset-password__text">
      В ссылке нет кода для смены пароля. Откройте ссылку из письма целиком или запросите новую.
    </p>
    <template #footer>
      Ссылка устарела?
      <RouterLink :to="{ name: 'forgot-password' }">Запросить новую</RouterLink>
    </template>
  </AuthLayout>
</template>

<style scoped>
.reset-password__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}
</style>
