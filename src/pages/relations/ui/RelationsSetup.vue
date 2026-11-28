<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { generateRelation, type RelationKind } from "@/entities/relation";
import { UiButton, UiSelect } from "@/shared/ui";
import {
  clampPairs,
  DEFAULT_KIND,
  DEFAULT_PAIRS,
  DEFAULT_SIZE,
  kindDescription,
  KIND_OPTIONS,
  pairsOptions,
  sizeOptions,
  toRelationKind,
  type GeneratedRelation,
} from "../lib/relationSetup";

const emit = defineEmits<{ generate: [result: GeneratedRelation] }>();

const kindValue = ref<string>(DEFAULT_KIND);
const sizeValue = ref(String(DEFAULT_SIZE));
const pairsValue = ref(String(DEFAULT_PAIRS));
const errorText = ref("");

const SIZE_OPTIONS = sizeOptions();

const kind = computed<RelationKind>(() => toRelationKind(kindValue.value));
const size = computed(() => Number(sizeValue.value));
const pairs = computed(() => Number(pairsValue.value));
const pairsList = computed(() => pairsOptions(size.value, kind.value));

// Тип или размер сменились: число пар должно остаться в допустимых границах
watch([kind, size], () => {
  pairsValue.value = String(clampPairs(pairs.value, size.value, kind.value));
  errorText.value = "";
});

function onGenerate() {
  const matrix = generateRelation(size.value, pairs.value, kind.value);
  if (matrix === null) {
    errorText.value =
      "Не получилось собрать связное отношение с такими параметрами. Попробуйте ещё раз.";
    return;
  }
  errorText.value = "";
  emit("generate", {
    matrix: matrix,
    kind: kind.value,
    size: size.value,
    pairs: pairs.value,
  });
}
</script>

<template>
  <section class="relations-setup" aria-label="Новое отношение">
    <div class="relations-setup__fields">
      <UiSelect
        v-model="kindValue"
        class="relations-setup__field"
        label="Тип отношения"
        :options="KIND_OPTIONS"
      />
      <UiSelect
        v-model="sizeValue"
        class="relations-setup__field"
        label="Число элементов"
        :options="SIZE_OPTIONS"
      />
      <UiSelect
        v-model="pairsValue"
        class="relations-setup__field"
        label="Число пар"
        :options="pairsList"
      />
      <UiButton variant="primary" @click="onGenerate">Сгенерировать</UiButton>
    </div>
    <p class="relations-setup__description">{{ kindDescription(kind) }}</p>
    <p v-if="errorText !== ''" class="relations-setup__error" role="alert">{{ errorText }}</p>
  </section>
</template>

<style scoped>
.relations-setup {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.relations-setup__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-4);
}

.relations-setup__field {
  min-width: 10rem;
}

.relations-setup__description {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
}

.relations-setup__error {
  margin: var(--space-2) 0 0;
  color: var(--color-danger);
}
</style>
