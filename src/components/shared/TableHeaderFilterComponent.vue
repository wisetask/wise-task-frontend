<template>
  <div class="table-header-filter" @click.stop @keydown.stop>
    <span class="table-header-filter__title">{{ title }}</span>
    <v-select
        v-if="items && items.length"
        :model-value="modelValue || ''"
        @update:model-value="emit('update:modelValue', $event || '')"
        :items="[{ title: 'Все', value: '' }, ...items.map(i => ({ title: i, value: i }))]"
        density="compact"
        variant="underlined"
        hide-details
        class="table-header-filter__control"
    />
    <v-text-field
        v-else
        :model-value="modelValue ?? ''"
        @update:model-value="emit('update:modelValue', $event)"
        density="compact"
        variant="underlined"
        hide-details
        clearable
        placeholder="Фильтр"
        class="table-header-filter__control"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "TableHeaderFilter",
  props: {
    title: {
      type: String,
      required: true,
    },
    modelValue: {
      type: String,
      default: "",
    },
    items: {
      type: Array as () => string[],
      default: undefined,
    },
  },
  emits: ["update:modelValue"],
});
</script>

<style scoped>
.table-header-filter {
  width: 100%;
}

.table-header-filter__title {
  display: block;
  font-size: 0.75rem;
  opacity: 0.7;
  line-height: 1;
}

.table-header-filter__control {
  margin-top: 2px;
}
</style>
