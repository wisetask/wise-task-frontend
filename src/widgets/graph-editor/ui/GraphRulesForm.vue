<script setup lang="ts">
import { UiCheckbox } from "@/shared/ui";
import {
  DIRECTION_TITLES,
  DIRECTIONS,
  RULE_FLAGS,
  withDirection,
  withFlag,
  type EditorRules,
  type GraphDirection,
  type RuleFlag,
} from "../lib/rules";

withDefaults(
  defineProps<{
    showDirection?: boolean;
  }>(),
  {
    showDirection: true,
  },
);

const rules = defineModel<EditorRules>({ required: true });

function setFlag(flag: RuleFlag, value: boolean) {
  rules.value = withFlag(rules.value, flag, value);
}

function onDirectionChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  rules.value = withDirection(rules.value, select.value as GraphDirection);
}
</script>

<template>
  <fieldset class="graph-rules">
    <legend class="graph-rules__legend">Что можно делать с графом</legend>
    <UiCheckbox
      v-for="option in RULE_FLAGS"
      :key="option.flag"
      :model-value="rules[option.flag]"
      :label="option.title"
      @update:model-value="setFlag(option.flag, $event)"
    />
    <label v-if="showDirection" class="graph-rules__direction">
      Вид графа
      <select class="graph-rules__select" :value="rules.direction" @change="onDirectionChange">
        <option v-for="direction in DIRECTIONS" :key="direction" :value="direction">
          {{ DIRECTION_TITLES[direction] }}
        </option>
      </select>
    </label>
  </fieldset>
</template>

<style scoped>
.graph-rules {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  margin: 0;
  padding: 0;
  border: 0;
}

.graph-rules__legend {
  float: left;
  margin-right: var(--space-2);
  padding: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.graph-rules__direction {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-md);
}

.graph-rules__select {
  height: var(--control-height-sm);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.graph-rules__select:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}
</style>
