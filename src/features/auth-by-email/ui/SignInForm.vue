<script setup lang="ts">
import { computed, ref } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { getAuthErrorMessage } from "../lib/getAuthErrorMessage";
import { useSignIn } from "../model/useSignIn";

const emit = defineEmits<{ success: [] }>();

const email = ref("");
const password = ref("");

const { signIn, loading, error } = useSignIn();
const errorMessage = computed(() => getAuthErrorMessage(error.value, "sign-in"));

async function onSubmit() {
  const isSuccess = await signIn(email.value.trim(), password.value);
  if (isSuccess) {
    emit("success");
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>
    <UiTextField v-model="email" label="Почта" type="email" autocomplete="email" required />
    <UiTextField
      v-model="password"
      label="Пароль"
      type="password"
      autocomplete="current-password"
      required
    />
    <UiButton type="submit" variant="primary" :loading="loading">Войти</UiButton>
  </form>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-md);
}
</style>
