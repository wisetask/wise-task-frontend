<script setup lang="ts">
import { computed, ref } from "vue";
import { UiButton, UiCheckbox, UiTextField } from "@/shared/ui";

const name = ref("");
const email = ref("");
const password = ref("");
const remember = ref(true);
const isSaving = ref(false);

const emailError = computed(() => {
  if (email.value !== "" && !email.value.includes("@")) {
    return "В почте должен быть символ @";
  }
  return "";
});

function fakeSave() {
  isSaving.value = true;
  setTimeout(() => {
    isSaving.value = false;
  }, 1500);
}
</script>

<template>
  <main class="ui-kit">
    <h1 class="ui-kit__title">Компоненты интерфейса</h1>
    <p class="ui-kit__lead">
      Все общие компоненты из <code>shared/ui</code> и их состояния. Страница для разработки.
    </p>

    <section class="ui-kit__section">
      <h2 class="ui-kit__heading">Кнопки</h2>
      <div class="ui-kit__row">
        <UiButton variant="primary">Сохранить</UiButton>
        <UiButton>Отмена</UiButton>
        <UiButton variant="ghost">Подробнее</UiButton>
        <UiButton variant="danger">Удалить</UiButton>
      </div>
      <div class="ui-kit__row">
        <UiButton variant="primary" size="sm">Сохранить</UiButton>
        <UiButton size="sm">Отмена</UiButton>
        <UiButton variant="ghost" size="sm">Подробнее</UiButton>
        <UiButton variant="danger" size="sm">Удалить</UiButton>
      </div>
      <div class="ui-kit__row">
        <UiButton variant="primary" disabled>Недоступна</UiButton>
        <UiButton variant="primary" :loading="isSaving" @click="fakeSave">
          {{ isSaving ? "Сохраняем" : "Нажми — загрузка" }}
        </UiButton>
      </div>
    </section>

    <section class="ui-kit__section">
      <h2 class="ui-kit__heading">Поля ввода</h2>
      <div class="ui-kit__form">
        <UiTextField v-model="name" label="Имя" placeholder="Как к вам обращаться" />
        <UiTextField
          v-model="email"
          label="Почта"
          type="email"
          placeholder="name@example.com"
          hint="Напиши почту без @, чтобы увидеть ошибку"
          :error="emailError"
          required
        />
        <UiTextField v-model="password" label="Пароль" type="password" required />
        <UiTextField model-value="Нельзя изменить" label="Недоступное поле" disabled />
      </div>
    </section>

    <section class="ui-kit__section">
      <h2 class="ui-kit__heading">Галочки</h2>
      <div class="ui-kit__row">
        <UiCheckbox v-model="remember" label="Запомнить меня" />
        <UiCheckbox :model-value="true" label="Недоступная галочка" disabled />
      </div>
    </section>
  </main>
</template>

<style scoped>
.ui-kit {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.ui-kit__title {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-xl);
}

.ui-kit__lead {
  margin: 0 0 var(--space-6);
  color: var(--color-text-muted);
}

.ui-kit__section {
  margin-bottom: var(--space-6);
}

.ui-kit__heading {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-lg);
}

.ui-kit__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.ui-kit__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 360px;
}
</style>
