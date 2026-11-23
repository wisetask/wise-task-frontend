<script setup lang="ts">
import { UiButton, UiTextField } from "@/shared/ui";
import {
  changeCondition,
  comparisonSigns,
  conditionError,
  moveCondition,
  propertyValues,
  removeCondition,
  type TaskCondition,
} from "../model/taskCondition";

const conditions = defineModel<TaskCondition[]>({ required: true });
</script>

<template>
  <p v-if="conditions.length === 0" class="empty">
    Условий пока нет. Добавьте проверку из списка плагинов
  </p>
  <div v-else class="conditions">
    <fieldset v-for="(condition, index) in conditions" :key="index" class="condition">
      <legend>{{ index + 1 }}. {{ condition.pluginName }}</legend>
      <div v-if="condition.pluginType === 'GRAPH_CHARACTERISTIC'" class="comparison">
        <label>
          Знак
          <select
            :value="condition.sign"
            @change="
              conditions = changeCondition(conditions, index, {
                sign: ($event.target as HTMLSelectElement).value,
              })
            "
          >
            <option v-for="sign in comparisonSigns" :key="sign">{{ sign }}</option>
          </select>
        </label>
        <UiTextField
          label="Значение"
          :model-value="condition.value"
          :error="conditionError(condition, 'value')"
          @update:model-value="conditions = changeCondition(conditions, index, { value: $event })"
        />
      </div>
      <label v-else>
        Результат проверки
        <select
          :value="condition.value"
          @change="
            conditions = changeCondition(conditions, index, {
              value: ($event.target as HTMLSelectElement).value,
            })
          "
        >
          <option v-for="value in propertyValues" :key="value">{{ value }}</option>
        </select>
      </label>
      <UiTextField
        label="Текст ошибки"
        :model-value="condition.mistakeText"
        :error="conditionError(condition, 'mistakeText')"
        @update:model-value="
          conditions = changeCondition(conditions, index, { mistakeText: $event })
        "
      />
      <div class="actions">
        <UiButton
          size="sm"
          :disabled="index === 0"
          @click="conditions = moveCondition(conditions, index, index - 1)"
          >Выше</UiButton
        >
        <UiButton
          size="sm"
          :disabled="index === conditions.length - 1"
          @click="conditions = moveCondition(conditions, index, index + 1)"
          >Ниже</UiButton
        >
        <UiButton
          size="sm"
          variant="danger"
          @click="conditions = removeCondition(conditions, index)"
        >
          Удалить
        </UiButton>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.conditions,
.condition {
  display: grid;
  gap: var(--space-3);
}

.condition {
  min-width: 0;
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.condition legend {
  font-weight: 600;
}

.comparison {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-3);
}

label {
  display: grid;
  justify-items: start;
  gap: var(--space-1);
  font-size: var(--font-size-md);
  font-weight: 500;
}

select {
  min-height: var(--control-height-md);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.empty {
  color: var(--color-text-muted);
}
</style>
