<script setup lang="ts">
import { computed, ref } from "vue";
import { pathsOfLength, power } from "@/entities/relation";
import { UiButton, UiCheckbox, UiTextField } from "@/shared/ui";
import {
  countFilled,
  countMistakes,
  emptyAnswers,
  isSolved,
  RelationMatrix,
  type Answers,
  type CellPosition,
} from "@/widgets/relation-matrix";
import TaskConditionsDemo from "./TaskConditionsDemo.vue";

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

const relation = [
  [0, 1, 1, 1, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 1, 0],
  [0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0],
];
const square = power(relation, 2, "classic");
const squareAnswers = ref<Answers>(emptyAnswers(5));
const showResult = ref(true);
const hovered = ref<CellPosition | null>(null);

const pathsText = computed(() => {
  if (hovered.value === null) {
    return "Наведите на клетку A², чтобы увидеть пути длины 2.";
  }
  const from = hovered.value.row + 1;
  const to = hovered.value.col + 1;
  const paths = pathsOfLength(relation, hovered.value.row, hovered.value.col, 2);
  if (paths.length === 0) {
    return "Из " + from + " в " + to + " путей длины 2 нет.";
  }
  const texts = paths.map((path) => path.map((vertex) => vertex + 1).join(" → "));
  return "Из " + from + " в " + to + ": " + texts.join(", ");
});

const progressText = computed(() => {
  if (isSolved(squareAnswers.value, square)) {
    return "Матрица заполнена верно.";
  }
  const filled = countFilled(squareAnswers.value);
  const mistakes = countMistakes(squareAnswers.value, square);
  return "Заполнено " + filled + " из 25, ошибок: " + mistakes + ".";
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

    <section class="ui-kit__section">
      <h2 class="ui-kit__heading">Матрица отношения</h2>
      <p class="ui-kit__note">
        Виджет из <code>widgets/relation-matrix</code>. Заполните A² — число путей длины 2.
      </p>
      <div class="ui-kit__row ui-kit__row--top">
        <RelationMatrix title="A" :values="relation" />
        <RelationMatrix
          v-model:answers="squareAnswers"
          title="A²"
          editable
          :expected="square"
          :show-result="showResult"
          :highlight="hovered"
          @hover="hovered = $event"
        />
      </div>
      <UiCheckbox v-model="showResult" label="Сразу показывать, верно или нет" />
      <p class="ui-kit__note">{{ pathsText }}</p>
      <p class="ui-kit__note">{{ progressText }}</p>
    </section>
    <section class="ui-kit__section">
      <h2 class="ui-kit__heading">Условия задачи</h2>
      <TaskConditionsDemo />
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

.ui-kit__row--top {
  align-items: flex-start;
  gap: var(--space-6);
}

.ui-kit__note {
  margin: var(--space-2) 0;
  color: var(--color-text-muted);
}

.ui-kit__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 360px;
}
</style>
