<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { filledShare, looksLikeEmail } from "../lib/formChecks";
import { getAuthErrorMessage } from "../lib/getAuthErrorMessage";
import { useSignIn } from "../model/useSignIn";

const emit = defineEmits<{ success: []; progress: [value: number]; failed: [] }>();

const email = ref("");
const password = ref("");

const showPassword = ref(false);
const capsLock = ref(false);

const emailOk = computed(() => looksLikeEmail(email.value));

const progress = computed(() => filledShare([emailOk.value, password.value !== ""]));

watch(progress, (value) => emit("progress", value), { immediate: true });

function onPasswordKey(event: KeyboardEvent) {
  capsLock.value = event.getModifierState("CapsLock");
}

const { signIn, loading, error } = useSignIn();
const errorMessage = computed(() => getAuthErrorMessage(error.value, "sign-in"));

async function onSubmit() {
  const isSuccess = await signIn(email.value.trim(), password.value);
  if (isSuccess) {
    emit("success");
  } else {
    emit("failed");
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>
    <UiTextField v-model="email" label="Почта" type="email" autocomplete="email" required>
      <template v-if="emailOk" #trailing>
        <svg class="auth-form__check" viewBox="0 0 16 16" aria-label="Почта выглядит верно">
          <path d="M4 8.5 L7 11 L12 5" />
        </svg>
      </template>
    </UiTextField>
    <UiTextField
      v-model="password"
      label="Пароль"
      :type="showPassword ? 'text' : 'password'"
      autocomplete="current-password"
      :hint="capsLock ? 'Включён Caps Lock' : ''"
      required
      @keydown="onPasswordKey"
      @keyup="onPasswordKey"
    >
      <template #trailing>
        <button
          type="button"
          class="auth-form__eye"
          :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
          :title="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
          :aria-pressed="showPassword"
          @click="showPassword = !showPassword"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12 C5 6, 19 6, 22 12 C19 18, 5 18, 2 12 Z" />
            <circle cx="12" cy="12" r="3" />
            <path v-if="showPassword" class="auth-form__eye-slash" d="M4 4 L20 20" />
          </svg>
        </button>
      </template>
    </UiTextField>
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
.auth-form__eye {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.auth-form__eye:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.auth-form__eye:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.auth-form__eye svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.auth-form__eye-slash {
  stroke-dasharray: 23;
  animation: auth-form-slash 220ms var(--ease-out) both;
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

.auth-form__error {
  animation: auth-form-error 360ms var(--ease-out);
}

@keyframes auth-form-slash {
  from {
    stroke-dashoffset: 23;
  }
  to {
    stroke-dashoffset: 0;
  }
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
