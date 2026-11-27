<script setup lang="ts">
import { computed } from "vue";
import type { UiSegmentedOption } from "./segmented";

const props = withDefaults(
  defineProps<{
    options: UiSegmentedOption[];
    label: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const model = defineModel<string>({ required: true });

const activeIndex = computed(() => {
  for (let i = 0; i < props.options.length; i++) {
    if (props.options[i].value === model.value) {
      return i;
    }
  }
  return -1;
});

const indicatorStyle = computed(() => {
  return {
    width: "calc((100% - 4px) / " + props.options.length + ")",
    transform: "translateX(" + activeIndex.value * 100 + "%)",
    opacity: activeIndex.value === -1 ? "0" : "1",
  };
});

const gridStyle = computed(() => {
  return { gridTemplateColumns: "repeat(" + props.options.length + ", 1fr)" };
});
</script>

<template>
  <div
    class="ui-segmented"
    :class="{ 'ui-segmented--disabled': disabled }"
    :style="gridStyle"
    role="radiogroup"
    :aria-label="label"
  >
    <span class="ui-segmented__indicator" :style="indicatorStyle" aria-hidden="true" />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="ui-segmented__option"
      :class="{ 'ui-segmented__option--active': option.value === model }"
      :aria-checked="option.value === model"
      :disabled="disabled"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented {
  position: relative;
  display: inline-grid;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-page);
}

.ui-segmented__indicator {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  border-radius: calc(var(--radius-md) - 2px);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  outline: 1px solid var(--color-border);
  transition:
    transform var(--duration) var(--ease-spring),
    opacity var(--duration-fast) var(--ease-out);
}

.ui-segmented__option {
  position: relative;
  height: calc(var(--control-height-sm) - 6px);
  padding: 0 var(--space-3);
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.ui-segmented__option:hover:not(:disabled) {
  color: var(--color-text);
}

.ui-segmented__option--active {
  color: var(--color-text);
}

.ui-segmented__option:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.ui-segmented--disabled {
  opacity: 0.5;
}

.ui-segmented--disabled .ui-segmented__option {
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .ui-segmented__indicator {
    transition: none;
  }
}
</style>
