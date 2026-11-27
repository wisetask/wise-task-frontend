<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { getAuthErrorMessage } from "../lib/getAuthErrorMessage";
import { useSendResetLink } from "../model/useSendResetLink";

// Бэк разрешает одно письмо на почту раз в 2 минуты (reset-password.send-limit в wise-task-profile).
const RESEND_DELAY_SECONDS = 120;

const email = ref("");
const sentTo = ref("");
const secondsLeft = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

const { sendResetLink, loading, error } = useSendResetLink();
const errorMessage = computed(() => getAuthErrorMessage(error.value, "send-reset-link"));

const resendLabel = computed(() => {
  if (secondsLeft.value <= 0) {
    return "Отправить ещё раз";
  }
  const minutes = Math.floor(secondsLeft.value / 60);
  const seconds = String(secondsLeft.value % 60).padStart(2, "0");
  return `Отправить ещё раз через ${minutes}:${seconds}`;
});

function startCooldown() {
  clearInterval(timer);
  secondsLeft.value = RESEND_DELAY_SECONDS;
  timer = setInterval(() => {
    secondsLeft.value -= 1;
    if (secondsLeft.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}

onUnmounted(() => clearInterval(timer));

async function send(address: string) {
  const isSent = await sendResetLink(address);
  if (isSent) {
    sentTo.value = address;
    startCooldown();
  }
}

function onSubmit() {
  send(email.value.trim());
}

function resend() {
  send(sentTo.value);
}

function changeEmail() {
  sentTo.value = "";
}
</script>

<template>
  <div v-if="sentTo" class="auth-form">
    <p class="auth-form__text">
      Мы отправили ссылку для смены пароля на <b>{{ sentTo }}</b>. Ссылка действует 10 минут.
    </p>
    <p class="auth-form__text">Письма нет? Проверьте папку «Спам» или отправьте ещё раз.</p>
    <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>
    <UiButton :disabled="secondsLeft > 0" :loading="loading" @click="resend">
      {{ resendLabel }}
    </UiButton>
    <UiButton variant="ghost" @click="changeEmail">Указать другую почту</UiButton>
  </div>

  <form v-else class="auth-form" @submit.prevent="onSubmit">
    <p class="auth-form__text">
      Укажите почту, с которой вы регистрировались. Пришлём на неё ссылку для смены пароля.
    </p>
    <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>
    <UiTextField v-model="email" label="Почта" type="email" autocomplete="email" required />
    <UiButton type="submit" variant="primary" :loading="loading">Отправить ссылку</UiButton>
  </form>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-form__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.auth-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-md);
}
</style>
