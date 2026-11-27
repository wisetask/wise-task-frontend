<script setup lang="ts">
import { computed } from "vue";
import { UiSegmented, type UiSegmentedOption } from "@/shared/ui";
import type { AlgorithmRun } from "../lib/algorithms";

const props = defineProps<{
  run: AlgorithmRun;
  index: number;
  playing: boolean;
  speed: string;
}>();

const emit = defineEmits<{
  step: [index: number];
  toggle: [];
  close: [];
  "update:speed": [speed: string];
}>();

const SPEED_OPTIONS: UiSegmentedOption[] = [
  { value: "0.5", label: "0,5×" },
  { value: "1", label: "1×" },
  { value: "2", label: "2×" },
];

const step = computed(() => {
  if (props.run.steps.length === 0) {
    return null;
  }
  return props.run.steps[props.index];
});

const lastIndex = computed(() => props.run.steps.length - 1);

const progress = computed(() => {
  if (props.run.steps.length <= 1) {
    return "100%";
  }
  return (props.index / lastIndex.value) * 100 + "%";
});

const playTitle = computed(() => (props.playing ? "Пауза (пробел)" : "Дальше само (пробел)"));

function goTo(index: number) {
  if (index >= 0 && index <= lastIndex.value) {
    emit("step", index);
  }
}
</script>

<template>
  <section class="graph-player" aria-label="Пошаговый алгоритм">
    <header class="graph-player__head">
      <h3 class="graph-player__title">{{ run.title }}</h3>
      <span v-if="step !== null" class="graph-player__count">
        Шаг {{ index + 1 }} из {{ run.steps.length }}
      </span>
      <button
        type="button"
        class="graph-player__close"
        title="Закрыть (Esc)"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4 L12 12 M12 4 L4 12" />
        </svg>
      </button>
    </header>

    <p v-if="run.error !== ''" class="graph-player__error">{{ run.error }}</p>

    <template v-else-if="step !== null">
      <div class="graph-player__progress" aria-hidden="true">
        <span class="graph-player__progress-bar" :style="{ width: progress }" />
      </div>

      <Transition name="graph-player-note" mode="out-in">
        <p :key="index" class="graph-player__note">{{ step.note }}</p>
      </Transition>

      <p class="graph-player__structure">
        <span class="graph-player__structure-title">{{ step.structureTitle }}:</span>
        <span v-if="step.structure.length === 0" class="graph-player__empty">пусто</span>
        <span v-for="(item, position) in step.structure" :key="position" class="graph-player__chip">
          {{ item }}
        </span>
      </p>

      <div class="graph-player__controls">
        <div class="graph-player__buttons">
          <button
            type="button"
            class="graph-player__button"
            title="В начало (Home)"
            aria-label="В начало"
            :disabled="index === 0"
            @click="goTo(0)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 5 V19 M18 6 L10 12 L18 18 Z" />
            </svg>
          </button>
          <button
            type="button"
            class="graph-player__button"
            title="Шаг назад (←)"
            aria-label="Шаг назад"
            :disabled="index === 0"
            @click="goTo(index - 1)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6 L9 12 L15 18" />
            </svg>
          </button>
          <button
            type="button"
            class="graph-player__button graph-player__button--main"
            :title="playTitle"
            :aria-label="playTitle"
            :aria-pressed="playing"
            @click="emit('toggle')"
          >
            <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5 V19 M16 5 V19" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5 L19 12 L8 19 Z" />
            </svg>
          </button>
          <button
            type="button"
            class="graph-player__button"
            title="Шаг вперёд (→)"
            aria-label="Шаг вперёд"
            :disabled="index === lastIndex"
            @click="goTo(index + 1)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6 L15 12 L9 18" />
            </svg>
          </button>
          <button
            type="button"
            class="graph-player__button"
            title="В конец (End)"
            aria-label="В конец"
            :disabled="index === lastIndex"
            @click="goTo(lastIndex)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 5 V19 M6 6 L14 12 L6 18 Z" />
            </svg>
          </button>
        </div>
        <UiSegmented
          :model-value="speed"
          :options="SPEED_OPTIONS"
          label="Скорость"
          @update:model-value="emit('update:speed', $event)"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.graph-player {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(560px, calc(100% - 32px));
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.graph-player__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.graph-player__title {
  flex: 1;
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 700;
}

.graph-player__count {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.graph-player__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.graph-player__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.graph-player__close svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.graph-player__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.graph-player__progress {
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--color-border);
}

.graph-player__progress-bar {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--graph-active);
  transition: width var(--duration) var(--ease-out);
}

.graph-player__note {
  min-height: 40px;
  margin: 0;
  font-size: var(--font-size-md);
  line-height: 1.45;
}

.graph-player__structure {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  font-size: var(--font-size-sm);
}

.graph-player__structure-title {
  margin-right: var(--space-1);
  color: var(--color-text-muted);
}

.graph-player__empty {
  color: var(--color-text-muted);
  font-style: italic;
}

.graph-player__chip {
  padding: 1px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-page);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.graph-player__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-1);
}

.graph-player__buttons {
  display: flex;
  gap: 2px;
}

.graph-player__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.graph-player__button:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.graph-player__button:active:not(:disabled) {
  transform: scale(0.9);
}

.graph-player__button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.graph-player__button:focus-visible,
.graph-player__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-player__button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.graph-player__button--main {
  width: 42px;
  background: var(--graph-active);
  color: #ffffff;
}

.graph-player__button--main:hover:not(:disabled) {
  background: var(--graph-active);
  filter: brightness(1.08);
}

.graph-player__button--main svg {
  fill: currentColor;
}

.graph-player-note-enter-active,
.graph-player-note-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.graph-player-note-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.graph-player-note-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
