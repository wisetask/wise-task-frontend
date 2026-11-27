<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { shownDots, type AttemptDot } from "../model/solutionList";

const props = withDefaults(
  defineProps<{
    attempts: AttemptDot[];
    limit?: number;
    small?: boolean;
    links?: boolean;
  }>(),
  {
    limit: 12,
    small: false,
    links: true,
  },
);

const shown = computed(() => shownDots(props.attempts, props.limit));

function dotTitle(index: number, dot: AttemptDot): string {
  const number = shown.value.hidden + index + 1;
  return "Попытка " + number + ": " + (dot.isCorrect ? "верно" : "неверно");
}

function dotClass(index: number, dot: AttemptDot): Record<string, boolean> {
  return {
    "path__dot--ok": dot.isCorrect,
    "path__dot--fail": !dot.isCorrect,
    "path__dot--last": index === shown.value.dots.length - 1,
  };
}
</script>

<template>
  <div class="path" :class="{ 'path--small': small }">
    <span v-if="shown.hidden > 0" class="path__more" :title="'Ещё ' + shown.hidden + ' раньше'">
      +{{ shown.hidden }}
    </span>
    <ol class="path__dots">
      <li
        v-for="(dot, index) in shown.dots"
        :key="dot.id"
        class="path__item"
        :class="{ 'path__item--ok': dot.isCorrect }"
        :style="{ '--path-index': String(index) }"
      >
        <RouterLink
          v-if="links"
          class="path__dot"
          :class="dotClass(index, dot)"
          :to="{ name: 'solution', params: { id: dot.id } }"
          :title="dotTitle(index, dot)"
          :aria-label="dotTitle(index, dot)"
        >
          <svg v-if="!small && dot.isCorrect" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
          </svg>
          <svg v-else-if="!small" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 5 L11 11 M11 5 L5 11" />
          </svg>
        </RouterLink>
        <span v-else class="path__dot" :class="dotClass(index, dot)" aria-hidden="true" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.path {
  --dot: 20px;
  --gap: 14px;

  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.path--small {
  --dot: 10px;
  --gap: 8px;
}

.path__more {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.path__dots {
  display: flex;
  align-items: center;
  gap: var(--gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.path__item {
  position: relative;
  display: flex;
  animation: path-pop 380ms var(--ease-spring) calc(var(--path-index) * 60ms + 120ms) backwards;
}

.path__item + .path__item::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 100%;
  width: var(--gap);
  height: 2px;
  margin-top: -1px;
  background: color-mix(in srgb, var(--color-danger) 45%, var(--color-border));
  transform-origin: left center;
  animation: path-line 300ms var(--ease-out) calc(var(--path-index) * 60ms + 60ms) backwards;
}

.path__item--ok + .path__item::before,
.path__item + .path__item--ok::before {
  background: color-mix(in srgb, var(--color-success) 60%, var(--color-border));
}

.path__dot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--dot);
  height: var(--dot);
  border-radius: 50%;
  color: var(--color-on-accent);
  transition:
    transform var(--duration) var(--ease-spring),
    box-shadow var(--duration) var(--ease-out);
}

.path__dot--ok {
  background: var(--color-success);
}

.path__dot--fail {
  background: var(--color-danger);
}

a.path__dot:hover {
  transform: scale(1.3);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 25%, transparent);
}

.path__dot:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.path__dot svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.path__dot--last::after {
  content: "";
  position: absolute;
  inset: -4px;
  border: 2px solid currentColor;
  border-radius: 50%;
  opacity: 0;
  animation: path-ring 2s var(--ease-out) 1s infinite;
}

.path__dot--last.path__dot--ok::after {
  color: var(--color-success);
}

.path__dot--last.path__dot--fail::after {
  color: var(--color-danger);
}

@keyframes path-pop {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
}

@keyframes path-line {
  from {
    transform: scaleX(0);
  }
}

@keyframes path-ring {
  0% {
    opacity: 0.8;
    transform: scale(0.9);
  }
  70%,
  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .path__dot--last::after {
    animation: none;
  }
}
</style>
