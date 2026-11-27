<script setup lang="ts">
import { computed } from "vue";
import { failureSummary, type CheckResult } from "../lib/checkResult";

const props = withDefaults(
  defineProps<{
    result: CheckResult;
    successTitle?: string;
    successText?: string;
    failureTitle?: string;
    note?: string;
    closable?: boolean;
  }>(),
  {
    successTitle: "Верно!",
    successText: "Все проверки пройдены.",
    failureTitle: "Пока неверно",
    note: "",
    closable: false,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const title = computed(() => (props.result.isCorrect ? props.successTitle : props.failureTitle));
const text = computed(() =>
  props.result.isCorrect ? props.successText : failureSummary(props.result),
);

function mistakeDelay(index: number): string {
  return 220 + index * 70 + "ms";
}
</script>

<template>
  <div
    class="check-result"
    :class="result.isCorrect ? 'check-result--success' : 'check-result--error'"
    :role="result.isCorrect ? 'status' : 'alert'"
  >
    <span class="check-result__icon" aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <circle class="check-result__ring" cx="20" cy="20" r="17" pathLength="1" />
        <path
          v-if="result.isCorrect"
          class="check-result__mark"
          d="M12.5 20.5 L18 26 L28 14.5"
          pathLength="1"
        />
        <path v-else class="check-result__mark" d="M14 14 L26 26 M26 14 L14 26" pathLength="1" />
      </svg>
    </span>
    <div class="check-result__body">
      <p class="check-result__title">{{ title }}</p>
      <p class="check-result__text">{{ text }}</p>
      <ul v-if="!result.isCorrect" class="check-result__mistakes">
        <li
          v-for="(mistake, index) in result.mistakes"
          :key="mistake.text + mistake.detail"
          class="check-result__mistake"
          :style="{ animationDelay: mistakeDelay(index) }"
        >
          {{ mistake.text }}
          <span v-if="mistake.detail !== ''" class="check-result__detail">
            {{ mistake.detail }}
          </span>
        </li>
      </ul>
      <p v-if="note !== ''" :key="note" class="check-result__note">{{ note }}</p>
      <div v-if="$slots.actions" class="check-result__actions">
        <slot name="actions" />
      </div>
    </div>
    <button
      v-if="closable"
      type="button"
      class="check-result__close"
      title="Скрыть"
      aria-label="Скрыть результат"
      @click="emit('close')"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 4 L12 12 M12 4 L4 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.check-result {
  --tone: var(--color-success);
  --tone-fill: var(--graph-green-fill);

  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  overflow: hidden;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-3);
  border: 1px solid color-mix(in srgb, var(--tone) 55%, var(--color-border));
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--tone-fill) 70%, var(--color-surface)),
    var(--color-surface) 70%
  );
  box-shadow:
    var(--shadow-popover),
    0 0 0 4px color-mix(in srgb, var(--tone) 12%, transparent);
}

.check-result--error {
  --tone: var(--color-danger);
  --tone-fill: var(--graph-red-fill);

  animation: check-result-shake 460ms var(--ease-out) 120ms;
}

.check-result--success::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -50%;
  width: 40%;
  background: linear-gradient(
    100deg,
    transparent,
    color-mix(in srgb, var(--color-surface) 55%, transparent),
    transparent
  );
  pointer-events: none;
  animation: check-result-shine 1s var(--ease-out) 350ms both;
}

.check-result__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--tone) 14%, transparent);
  animation: check-result-pop 520ms var(--ease-spring) both;
}

.check-result__icon svg {
  display: block;
  width: 40px;
  height: 40px;
  fill: none;
  stroke: var(--tone);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.check-result__ring {
  stroke-dasharray: 1;
  transform: rotate(-90deg);
  transform-origin: center;
  animation: check-result-draw 520ms var(--ease-out) 80ms both;
}

.check-result__mark {
  stroke-dasharray: 1;
  animation: check-result-draw 360ms var(--ease-out) 420ms both;
}

.check-result__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.check-result__title {
  margin: 0;
  color: var(--tone);
  font-size: var(--font-size-lg);
  font-weight: 800;
  line-height: 1.3;
}

.check-result__text {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.check-result__mistakes {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-2) 0 0;
  padding: 0;
  list-style: none;
}

.check-result__mistake {
  position: relative;
  padding-left: var(--space-4);
  font-size: var(--font-size-md);
  line-height: 1.4;
  animation: check-result-slide 360ms var(--ease-out) both;
}

.check-result__mistake::before {
  content: "";
  position: absolute;
  top: 0.45em;
  left: 2px;
  width: 8px;
  height: 8px;
  border: 2px solid var(--tone);
  border-radius: 50%;
}

.check-result__detail {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.check-result__note {
  margin: var(--space-2) 0 0;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--graph-active) 18%, transparent);
  font-size: var(--font-size-sm);
  animation: check-result-wiggle 520ms var(--ease-spring);
}

.check-result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
  animation: check-result-slide 360ms var(--ease-out) 500ms backwards;
}

.check-result__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin: -2px -6px 0 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.check-result__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
  transform: rotate(90deg);
}

.check-result__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.check-result__close svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

@keyframes check-result-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}

@keyframes check-result-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes check-result-slide {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
}

@keyframes check-result-shake {
  20%,
  60% {
    transform: translateX(-7px);
  }
  40%,
  80% {
    transform: translateX(7px);
  }
}

@keyframes check-result-shine {
  to {
    left: 130%;
  }
}

@keyframes check-result-wiggle {
  25% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(2deg);
  }
  75% {
    transform: rotate(-1deg);
  }
}
</style>
