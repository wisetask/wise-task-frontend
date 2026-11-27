<script setup lang="ts">
import { computed, ref } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { getAuthErrorMessage } from "../lib/getAuthErrorMessage";
import { useResetPassword } from "../model/useResetPassword";

const props = defineProps<{ recoveryToken: string }>();
const emit = defineEmits<{ success: [] }>();

const MIN_PASSWORD_LENGTH = 3;

const password = ref("");
const repeatPassword = ref("");
const passwordError = ref("");
const repeatError = ref("");

const { resetPassword, loading, error } = useResetPassword();
const errorMessage = computed(() => getAuthErrorMessage(error.value, "reset-password"));

function validate(): boolean {
  passwordError.value =
    password.value.length < MIN_PASSWORD_LENGTH ? "Пароль не короче 3 символов" : "";
  repeatError.value = repeatPassword.value !== password.value ? "Пароли не совпадают" : "";
  return passwordError.value === "" && repeatError.value === "";
}

async function onSubmit() {
  if (!validate()) {
    return;
  }
  const isSuccess = await resetPassword(props.recoveryToken, password.value);
  if (isSuccess) {
    emit("success");
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>
    <UiTextField
      v-model="password"
      label="Новый пароль"
      type="password"
      autocomplete="new-password"
      hint="Не короче 3 символов"
      :error="passwordError"
      required
    />
    <UiTextField
      v-model="repeatPassword"
      label="Повторите пароль"
      type="password"
      autocomplete="new-password"
      :error="repeatError"
      required
    />
    <UiButton type="submit" variant="primary" :loading="loading">Сменить пароль</UiButton>
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
