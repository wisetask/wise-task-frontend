<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { passwordStrength } from "@/shared/lib/passwordStrength";
import { UiButton, UiTextField } from "@/shared/ui";
import {
  changePasswordErrorMessage,
  checkPasswordChange,
  hasErrors,
  type PasswordChangeErrors,
} from "../lib/passwordChange";
import { useChangePassword } from "../model/useChangePassword";

const oldPassword = ref("");
const newPassword = ref("");
const repeatPassword = ref("");

const triedToSubmit = ref(false);
const done = ref(false);

const showPasswords = ref(false);
const capsLock = ref(false);

const passwordChange = useChangePassword();
const loading = passwordChange.loading;
const errorMessage = computed(() => changePasswordErrorMessage(passwordChange.error.value));

const strength = computed(() => passwordStrength(newPassword.value));

const fieldErrors = computed((): PasswordChangeErrors => {
  if (!triedToSubmit.value) {
    return { oldPassword: "", newPassword: "", repeatPassword: "" };
  }
  return checkPasswordChange({
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
    repeatPassword: repeatPassword.value,
  });
});

const fieldType = computed(() => (showPasswords.value ? "text" : "password"));
const capsHint = computed(() => (capsLock.value ? "Включён Caps Lock" : ""));

watch([oldPassword, newPassword, repeatPassword], () => {
  done.value = false;
});

function onPasswordKey(event: KeyboardEvent) {
  capsLock.value = event.getModifierState("CapsLock");
}

async function onSubmit() {
  triedToSubmit.value = true;
  const errors = checkPasswordChange({
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
    repeatPassword: repeatPassword.value,
  });
  if (hasErrors(errors)) {
    return;
  }

  const isChanged = await passwordChange.changePassword(oldPassword.value, newPassword.value);
  if (!isChanged) {
    return;
  }
  oldPassword.value = "";
  newPassword.value = "";
  repeatPassword.value = "";
  triedToSubmit.value = false;
  showPasswords.value = false;
  done.value = true;
}
</script>

<template>
  <form class="password-form" novalidate @submit.prevent="onSubmit">
    <p v-if="errorMessage" class="password-form__error" role="alert">{{ errorMessage }}</p>
    <p v-if="done" class="password-form__done" role="status">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 8.5 L7 11 L12 5" />
      </svg>
      Пароль изменён
    </p>

    <UiTextField
      v-model="oldPassword"
      label="Текущий пароль"
      :type="fieldType"
      autocomplete="current-password"
      :hint="capsHint"
      :error="fieldErrors.oldPassword"
      required
      @keydown="onPasswordKey"
      @keyup="onPasswordKey"
    >
      <template #trailing>
        <button
          type="button"
          class="password-form__eye"
          :aria-label="showPasswords ? 'Скрыть пароли' : 'Показать пароли'"
          :title="showPasswords ? 'Скрыть пароли' : 'Показать пароли'"
          :aria-pressed="showPasswords"
          @click="showPasswords = !showPasswords"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12 C5 6, 19 6, 22 12 C19 18, 5 18, 2 12 Z" />
            <circle cx="12" cy="12" r="3" />
            <path v-if="showPasswords" class="password-form__eye-slash" d="M4 4 L20 20" />
          </svg>
        </button>
      </template>
    </UiTextField>

    <div class="password-form__new">
      <UiTextField
        v-model="newPassword"
        label="Новый пароль"
        :type="fieldType"
        autocomplete="new-password"
        :hint="capsHint !== '' ? capsHint : 'Не короче 3 символов'"
        :error="fieldErrors.newPassword"
        required
        @keydown="onPasswordKey"
        @keyup="onPasswordKey"
      />
      <div
        v-if="strength.level > 0"
        class="password-form__strength"
        :class="'password-form__strength--' + strength.level"
      >
        <span v-for="segment in 4" :key="segment" class="password-form__segment" />
        <span class="password-form__strength-title">{{ strength.title }}</span>
      </div>
    </div>

    <UiTextField
      v-model="repeatPassword"
      label="Повторите новый пароль"
      :type="fieldType"
      autocomplete="new-password"
      :hint="capsHint"
      :error="fieldErrors.repeatPassword"
      required
      @keydown="onPasswordKey"
      @keyup="onPasswordKey"
    />

    <div class="password-form__actions">
      <UiButton type="submit" variant="primary" :loading="loading">Сменить пароль</UiButton>
    </div>
  </form>
</template>

<style scoped>
.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.password-form__error,
.password-form__done {
  margin: 0;
  font-size: var(--font-size-md);
}

.password-form__error {
  color: var(--color-danger);
  animation: password-form-shake 360ms var(--ease-out);
}

.password-form__done {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  color: var(--color-success);
  font-weight: 600;
  animation: password-form-pop 320ms var(--ease-spring);
}

.password-form__done svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 14;
  animation: password-form-check 360ms var(--ease-out) 80ms both;
}

.password-form__new {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.password-form__actions {
  display: flex;
}

.password-form__eye {
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

.password-form__eye:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.password-form__eye:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.password-form__eye svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.password-form__eye-slash {
  stroke-dasharray: 23;
  animation: password-form-slash 220ms var(--ease-out) both;
}

.password-form__strength {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  align-items: center;
  gap: var(--space-1);
}

.password-form__segment {
  height: 5px;
  border-radius: 3px;
  background: var(--color-border);
  transition: background-color var(--duration) var(--ease-out);
}

.password-form__strength-title {
  min-width: 112px;
  padding-left: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: right;
}

.password-form__strength--1 .password-form__segment:nth-child(-n + 1) {
  background: var(--color-danger);
}

.password-form__strength--2 .password-form__segment:nth-child(-n + 2) {
  background: var(--graph-active);
}

.password-form__strength--3 .password-form__segment:nth-child(-n + 3) {
  background: var(--color-accent);
}

.password-form__strength--4 .password-form__segment {
  background: var(--color-success);
}

@keyframes password-form-slash {
  from {
    stroke-dashoffset: 23;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes password-form-check {
  from {
    stroke-dashoffset: 14;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes password-form-pop {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}

@keyframes password-form-shake {
  0% {
    opacity: 0;
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
