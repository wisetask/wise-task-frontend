<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ResetPasswordForm } from "@/features/auth-by-email";

const route = useRoute();
const router = useRouter();

// Токен приходит в ссылке из письма: ...?token=<uuid>
const recoveryToken = computed(() => {
  const token = route.query.token;
  return typeof token === "string" ? token : "";
});

function onSuccess() {
  router.push("/");
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-page__card">
      <h1 class="auth-page__title">Новый пароль</h1>
      <ResetPasswordForm
        v-if="recoveryToken"
        :recovery-token="recoveryToken"
        @success="onSuccess"
      />
      <p v-else class="auth-page__text">
        В ссылке нет кода для смены пароля. Откройте ссылку из письма целиком или запросите новую.
      </p>
      <p class="auth-page__switch">
        <RouterLink :to="{ name: 'forgot-password' }">Запросить новую ссылку</RouterLink>
      </p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-surface-muted);
}

.auth-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 400px;
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.auth-page__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.auth-page__text,
.auth-page__switch {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}
</style>
