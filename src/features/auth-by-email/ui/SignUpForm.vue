<script setup lang="ts">
import { computed, ref } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { getAuthErrorMessage } from "../lib/getAuthErrorMessage";
import { useSignUp } from "../model/useSignUp";

const emit = defineEmits<{ success: [] }>();

const lastName = ref("");
const firstName = ref("");
const patronymic = ref("");
const email = ref("");
const password = ref("");

const NAME_HINT = "От 2 до 20 символов, без пробелов и буквы «ё»";

const { signUp, loading, error } = useSignUp();
const errorMessage = computed(() => getAuthErrorMessage(error.value, "sign-up"));

async function onSubmit() {
  const isSuccess = await signUp({
    lastName: lastName.value.trim(),
    firstName: firstName.value.trim(),
    patronymic: patronymic.value.trim(),
    email: email.value.trim(),
    password: password.value,
  });
  if (isSuccess) {
    emit("success");
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>
    <UiTextField
      v-model="lastName"
      label="Фамилия"
      autocomplete="family-name"
      :hint="NAME_HINT"
      required
    />
    <UiTextField
      v-model="firstName"
      label="Имя"
      autocomplete="given-name"
      :hint="NAME_HINT"
      required
    />
    <UiTextField v-model="patronymic" label="Отчество" autocomplete="additional-name" />
    <UiTextField v-model="email" label="Почта" type="email" autocomplete="email" required />
    <UiTextField
      v-model="password"
      label="Пароль"
      type="password"
      autocomplete="new-password"
      hint="Не короче 3 символов"
      required
    />
    <UiButton type="submit" variant="primary" :loading="loading">Зарегистрироваться</UiButton>
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
