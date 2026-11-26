<script setup lang="ts">
import type { CheckResult } from "../lib/checkResult";

withDefaults(
  defineProps<{
    result: CheckResult;
    successText?: string;
    failureText?: string;
  }>(),
  {
    successText: "Верно! Все проверки пройдены.",
    failureText: "Пока неверно:",
  },
);
</script>

<template>
  <p v-if="result.isCorrect" class="check-result check-result--success" role="status">
    {{ successText }}
  </p>
  <div v-else class="check-result check-result--error" role="alert">
    <span>{{ failureText }}</span>
    <ul class="check-result__mistakes">
      <li v-for="mistake in result.mistakes" :key="mistake.text + mistake.detail">
        {{ mistake.text }}
        <span v-if="mistake.detail !== ''" class="check-result__detail">
          {{ mistake.detail }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.check-result {
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-md);
}

.check-result--success {
  background: var(--graph-green-fill);
}

.check-result--error {
  background: var(--graph-red-fill);
}

.check-result__mistakes {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-5);
}

.check-result__detail {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
