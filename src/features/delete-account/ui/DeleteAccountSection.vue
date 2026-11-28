<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { UiButton, UiTextField } from "@/shared/ui";
import { deleteAccountErrorMessage, isDeleteConfirmed } from "../lib/deleteConfirm";
import { useDeleteAccount } from "../model/useDeleteAccount";

const props = defineProps<{ email: string }>();
const emit = defineEmits<{ deleted: [] }>();

const opened = ref(false);
const typedEmail = ref("");
const panel = ref<HTMLElement | null>(null);

const accountDeletion = useDeleteAccount();
const loading = accountDeletion.loading;
const errorMessage = computed(() => deleteAccountErrorMessage(accountDeletion.error.value));

const confirmed = computed(() => isDeleteConfirmed(typedEmail.value, props.email));

async function open() {
  opened.value = true;
  await nextTick();
  const input = panel.value === null ? null : panel.value.querySelector("input");
  if (input !== null) {
    input.focus();
  }
}

function cancel() {
  opened.value = false;
  typedEmail.value = "";
}

async function onSubmit() {
  if (!confirmed.value) {
    return;
  }
  const isDeleted = await accountDeletion.deleteAccount();
  if (isDeleted) {
    emit("deleted");
  }
}
</script>

<template>
  <div class="delete-account">
    <p class="delete-account__text">
      Аккаунт удалится без возможности восстановления. Войти с этой почтой и паролем больше не
      получится.
    </p>

    <div v-if="!opened">
      <UiButton variant="danger" @click="open">Удалить аккаунт…</UiButton>
    </div>

    <form v-else ref="panel" class="delete-account__panel" @submit.prevent="onSubmit">
      <p v-if="errorMessage" class="delete-account__error" role="alert">{{ errorMessage }}</p>
      <UiTextField
        v-model="typedEmail"
        label="Чтобы подтвердить, введите свою почту"
        type="email"
        inputmode="email"
        autocomplete="off"
        :placeholder="email"
      />
      <div class="delete-account__actions">
        <UiButton type="submit" variant="danger" :disabled="!confirmed" :loading="loading">
          Удалить навсегда
        </UiButton>
        <UiButton variant="ghost" @click="cancel">Отмена</UiButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.delete-account {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.delete-account__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.delete-account__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--color-danger) 40%, var(--color-border));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-danger) 6%, var(--color-surface));
  animation: delete-account-open 260ms var(--ease-out);
}

.delete-account__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-md);
}

.delete-account__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@keyframes delete-account-open {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
}
</style>
