<script setup lang="ts">
import { computed, ref } from "vue";
import { motionAllowed } from "@/shared/lib/motion";

const WALK = "M232 75 Q190 26 120 24 Q88 48 112 75 Q88 102 120 126 Q152 102 112 75 Q152 48 120 24";
const WALK_STEP = 800;

const run = ref(0);
const lively = computed(() => motionAllowed());

function stepDelay(step: number): string {
  return 400 + step * WALK_STEP + "ms";
}

function again() {
  run.value = run.value + 1;
}
</script>

<template>
  <figure :key="run" class="konigsberg" aria-label="Задача о кёнигсбергских мостах">
    <svg class="konigsberg__art" viewBox="0 0 280 150" aria-hidden="true">
      <path
        class="konigsberg__river"
        d="M0 55 C70 40, 150 40, 280 58 M0 98 C70 112, 150 112, 280 94"
      />
      <path
        class="konigsberg__bridge"
        d="M232 75 Q190 26 120 24"
        :style="{ '--step': stepDelay(0) }"
      />
      <path
        class="konigsberg__bridge"
        d="M120 24 Q88 48 112 75"
        :style="{ '--step': stepDelay(1) }"
      />
      <path
        class="konigsberg__bridge"
        d="M112 75 Q88 102 120 126"
        :style="{ '--step': stepDelay(2) }"
      />
      <path
        class="konigsberg__bridge"
        d="M120 126 Q152 102 112 75"
        :style="{ '--step': stepDelay(3) }"
      />
      <path
        class="konigsberg__bridge"
        d="M112 75 Q152 48 120 24"
        :style="{ '--step': stepDelay(4) }"
      />
      <path class="konigsberg__bridge konigsberg__bridge--left" d="M112 75 L232 75" />
      <path class="konigsberg__bridge konigsberg__bridge--left" d="M120 126 Q190 124 232 75" />
      <circle class="konigsberg__land" cx="120" cy="24" r="9" />
      <circle class="konigsberg__land" cx="120" cy="126" r="9" />
      <circle class="konigsberg__land" cx="112" cy="75" r="9" />
      <circle class="konigsberg__land" cx="232" cy="75" r="9" />
      <circle class="konigsberg__stuck" cx="120" cy="24" r="9" />
      <circle v-if="lively" class="konigsberg__walker" r="5">
        <animateMotion :path="WALK" dur="4s" begin="0.4s" fill="freeze" />
      </circle>
    </svg>
    <figcaption class="konigsberg__text">
      <strong>Кёнигсбергские мосты.</strong>
      Пройти по каждому из семи мостов ровно один раз нельзя: из всех четырёх частей города выходит
      нечётное число мостов. Это доказал Эйлер в 1736 году — с этого началась теория графов.
      <button type="button" class="konigsberg__again" @click="again">Попробовать ещё раз</button>
    </figcaption>
  </figure>
</template>

<style scoped>
.konigsberg {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid color-mix(in srgb, var(--graph-active) 50%, var(--color-border));
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  animation: konigsberg-in 420ms var(--ease-spring) backwards;
}

.konigsberg__art {
  flex-shrink: 0;
  width: 220px;
  height: 118px;
}

.konigsberg__river {
  fill: none;
  stroke: var(--graph-blue-stroke);
  stroke-width: 2;
  stroke-dasharray: 6 5;
  opacity: 0.5;
}

.konigsberg__bridge {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 3;
  stroke-linecap: round;
  animation: konigsberg-walked 300ms var(--ease-out) var(--step) forwards;
}

.konigsberg__bridge--left {
  animation: konigsberg-left 600ms ease-in-out 4.5s 3;
}

.konigsberg__land {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
}

.konigsberg__stuck {
  fill: none;
  stroke: var(--color-danger);
  stroke-width: 3;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: konigsberg-stuck 900ms var(--ease-out) 4.4s 2;
}

.konigsberg__walker {
  fill: var(--graph-active);
  filter: drop-shadow(0 0 4px var(--graph-active));
}

.konigsberg__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.konigsberg__text strong {
  color: var(--color-text);
}

.konigsberg__again {
  display: block;
  margin-top: var(--space-2);
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.konigsberg__again:hover {
  text-decoration: underline;
}

.konigsberg__again:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

@keyframes konigsberg-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}

@keyframes konigsberg-walked {
  to {
    stroke: var(--graph-active);
  }
}

@keyframes konigsberg-left {
  50% {
    stroke: var(--color-danger);
  }
}

@keyframes konigsberg-stuck {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(2.4);
  }
}

@media (max-width: 640px) {
  .konigsberg {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
