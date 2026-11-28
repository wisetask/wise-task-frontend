<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { looksLikeEmail } from "../lib/formChecks";
import { getAuthErrorMessage } from "../lib/getAuthErrorMessage";
import { useSendResetLink } from "../model/useSendResetLink";

const emit = defineEmits<{ success: []; progress: [value: number]; failed: [] }>();

// Бэк разрешает одно письмо на почту раз в 2 минуты (reset-password.send-limit в wise-task-profile).
const RESEND_DELAY_SECONDS = 120;

const email = ref("");
const sentTo = ref("");
const secondsLeft = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

const emailOk = computed(() => looksLikeEmail(email.value));
watch(emailOk, (value) => emit("progress", value ? 1 : 0), { immediate: true });

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
    emit("success");
  } else {
    emit("failed");
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
    <UiTextField v-model="email" label="Почта" type="email" autocomplete="email" required>
      <template v-if="emailOk" #trailing>
        <svg class="auth-form__check" viewBox="0 0 16 16" aria-label="Почта выглядит верно">
          <path d="M4 8.5 L7 11 L12 5" />
        </svg>
      </template>
    </UiTextField>
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
  animation: auth-form-error 360ms var(--ease-out);
}

.auth-form__check {
  width: 18px;
  height: 18px;
  margin-right: 6px;
  fill: none;
  stroke: var(--color-success);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 14;
  animation: auth-form-check 320ms var(--ease-out) both;
}

@keyframes auth-form-check {
  from {
    stroke-dashoffset: 14;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes auth-form-error {
  0% {
    opacity: 0;
    transform: translateX(0);
  }
  30% {
    transform: translateX(-6px);
  }
  60% {
    transform: translateX(5px);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
</style>
