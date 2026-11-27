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
import type { PluginType } from "../model/plugin";
import { pluginTypeTitle } from "../model/pluginType";
import PluginTypeIcon from "./PluginTypeIcon.vue";

const conditions = defineModel<TaskCondition[]>({ required: true });

function typeClass(type: PluginType): string {
  if (type === "GRAPH_CHARACTERISTIC") {
    return "condition--number";
  }
  if (type === "GRAPH_NEW_GRAPH") {
    return "condition--graph";
  }
  if (type === "GRAPH_STRING") {
    return "condition--string";
  }
  return "condition--property";
}
</script>

<template>
  <div v-if="conditions.length === 0" class="empty">
    <svg class="empty__picture" viewBox="0 0 120 64" aria-hidden="true">
      <path class="empty__edge" d="M20 44 L60 16 L100 44 Z" />
      <circle class="empty__vertex" cx="20" cy="44" r="7" />
      <circle class="empty__vertex" cx="60" cy="16" r="7" />
      <circle class="empty__vertex" cx="100" cy="44" r="7" />
    </svg>
    <p class="empty__text">Условий пока нет. Добавьте проверку из списка плагинов</p>
  </div>
  <TransitionGroup v-else tag="div" name="condition" class="conditions">
    <fieldset
      v-for="(condition, index) in conditions"
      :key="condition.id"
      class="condition"
      :class="typeClass(condition.pluginType)"
    >
      <legend class="condition__legend">
        <PluginTypeIcon :type="condition.pluginType" />
        <span class="condition__number">{{ index + 1 }}.</span> {{ condition.pluginName }}
      </legend>
      <span class="condition__type">{{ pluginTypeTitle(condition.pluginType) }}</span>
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
        hint="Студент увидит его, если проверка не пройдёт"
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
        >
          <svg class="actions__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 13 V3 M4 7 L8 3 L12 7" />
          </svg>
          Выше
        </UiButton>
        <UiButton
          size="sm"
          :disabled="index === conditions.length - 1"
          @click="conditions = moveCondition(conditions, index, index + 1)"
        >
          <svg class="actions__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 3 V13 M4 9 L8 13 L12 9" />
          </svg>
          Ниже
        </UiButton>
        <UiButton
          size="sm"
          variant="danger"
          class="actions__remove"
          @click="conditions = removeCondition(conditions, index)"
        >
          <svg class="actions__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 4.5 H13 M6.5 4.5 V3 H9.5 V4.5 M4.5 4.5 L5.2 13 H10.8 L11.5 4.5" />
          </svg>
          Удалить
        </UiButton>
      </div>
    </fieldset>
  </TransitionGroup>
</template>

<style scoped>
.conditions {
  position: relative;
  display: grid;
  gap: var(--space-3);
}

.condition {
  --type: var(--color-success);

  position: relative;
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  margin: 0;
  padding: var(--space-3) var(--space-4) var(--space-4);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--type);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition:
    border-color var(--duration) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
}

.condition:focus-within {
  border-color: color-mix(in srgb, var(--type) 50%, var(--color-border));
  border-left-color: var(--type);
  box-shadow: var(--shadow-popover);
}

.condition--number {
  --type: var(--color-accent);
}

.condition--graph {
  --type: var(--graph-active);
}

.condition--string {
  --type: color-mix(in oklch, var(--color-accent), var(--color-danger));
}

.condition__legend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 2px var(--space-3) 2px var(--space-2);
  border-radius: 999px;
  background: color-mix(in srgb, var(--type) 12%, var(--color-surface));
  font-weight: 600;
}

.condition__legend .plugin-type-icon {
  width: 18px;
  height: 18px;
  color: var(--type);
}

.condition__number {
  color: var(--type);
}

.condition__type {
  position: absolute;
  top: var(--space-2);
  right: var(--space-3);
  color: var(--type);
  font-size: 12px;
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
  transition: border-color var(--duration-fast) var(--ease-out);
}

select:hover {
  border-color: var(--type);
}

select:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -1px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.actions__remove {
  margin-left: auto;
}

.actions__icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: -2px;
}

.empty {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.empty__picture {
  width: 120px;
  height: 64px;
}

.empty__edge {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 2;
  stroke-dasharray: 6 6;
  animation: empty-march 1.6s linear infinite;
}

.empty__vertex {
  fill: var(--color-surface);
  stroke: var(--color-text-muted);
  stroke-width: 1.5;
}

.empty__text {
  margin: 0;
  color: var(--color-text-muted);
}

.condition-enter-active {
  animation: condition-in 520ms var(--ease-spring);
}

.condition-leave-active {
  position: absolute;
  right: 0;
  left: 0;
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.condition-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.97);
}

.condition-move {
  transition: transform 360ms var(--ease-out);
}

@keyframes condition-in {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--type) 40%, transparent);
  }
  60% {
    opacity: 1;
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--type) 0%, transparent);
  }
  100% {
    transform: none;
  }
}

@keyframes empty-march {
  to {
    stroke-dashoffset: -24;
  }
}
</style>
