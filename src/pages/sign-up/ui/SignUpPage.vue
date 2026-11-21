<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from "vue-router";
import { SignUpForm, getRedirectPath } from "@/features/auth-by-email";

const route = useRoute();
const router = useRouter();

function onSuccess() {
  router.push(getRedirectPath(route.query.redirect));
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-page__card">
      <h1 class="auth-page__title">Регистрация</h1>
      <SignUpForm @success="onSuccess" />
      <p class="auth-page__switch">
        Уже есть аккаунт?
        <RouterLink :to="{ name: 'sign-in', query: route.query }">Войти</RouterLink>
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

.auth-page__switch {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}
</style>
