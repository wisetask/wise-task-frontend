<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import { nextTip, SOLUTION_TIPS } from "../model/tips";

const TIP_TIME = 9000;

const index = ref(0);
let timer = 0;

function showNext() {
  index.value = nextTip(index.value, SOLUTION_TIPS.length);
  restart();
}

function restart() {
  window.clearInterval(timer);
  if (motionAllowed()) {
    timer = window.setInterval(() => {
      index.value = nextTip(index.value, SOLUTION_TIPS.length);
    }, TIP_TIME);
  }
}

onMounted(restart);

onBeforeUnmount(() => {
  window.clearInterval(timer);
});
</script>

<template>
  <section class="tips" aria-live="polite">
    <div class="tips__head">
      <p class="tips__label">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 18 H15 M10 21 H14 M12 3 A6 6 0 0 0 8 13.5 C8.8 14.3 9 15 9 16 H15 C15 15 15.2 14.3 16 13.5 A6 6 0 0 0 12 3 Z"
          />
        </svg>
        Подсказка
      </p>
      <button type="button" class="tips__next" @click="showNext">Ещё</button>
    </div>
    <Transition name="tips-swap" mode="out-in">
      <p :key="index" class="tips__text">{{ SOLUTION_TIPS[index] }}</p>
    </Transition>
    <div class="tips__dots" aria-hidden="true">
      <span
        v-for="(tip, position) in SOLUTION_TIPS"
        :key="tip"
        class="tips__dot"
        :class="{ 'tips__dot--active': position === index }"
      />
    </div>
  </section>
</template>

<style scoped>
.tips {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tips__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tips__label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.tips__label svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--graph-active);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: tips-glow 2.4s ease-in-out infinite;
}

.tips__next {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.tips__next:hover {
  text-decoration: underline;
}

.tips__next:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.tips__text {
  min-height: 3em;
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.tips__dots {
  display: flex;
  gap: 5px;
}

.tips__dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  transition:
    width var(--duration) var(--ease-spring),
    background-color var(--duration) var(--ease-out);
}

.tips__dot--active {
  width: 18px;
  background: var(--color-accent);
}

.tips-swap-enter-active,
.tips-swap-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.tips-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tips-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes tips-glow {
  50% {
    filter: drop-shadow(0 0 4px var(--graph-active));
  }
}
</style>
