<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import { GRAPH_FACTS, nextFactIndex, shapePicture } from "../model/graphFacts";

const FACT_TIME = 15000;

const index = ref(new Date().getDate() % GRAPH_FACTS.length);
let timer = 0;

const fact = computed(() => GRAPH_FACTS[index.value]);
const picture = computed(() => shapePicture(fact.value.shape));

function lineStyle(order: number): Record<string, string> {
  return { animationDelay: order * 40 + "ms" };
}

function pointStyle(order: number): Record<string, string> {
  return { animationDelay: 200 + order * 50 + "ms" };
}

function showNext() {
  index.value = nextFactIndex(index.value, GRAPH_FACTS.length);
  restartTimer();
}

function restartTimer() {
  window.clearInterval(timer);
  if (motionAllowed()) {
    timer = window.setInterval(() => {
      index.value = nextFactIndex(index.value, GRAPH_FACTS.length);
    }, FACT_TIME);
  }
}

onMounted(restartTimer);

onBeforeUnmount(() => {
  window.clearInterval(timer);
});
</script>

<template>
  <section class="fact" aria-live="polite">
    <div class="fact__head">
      <p class="fact__label">Факт о графах</p>
      <button type="button" class="fact__more" @click="showNext">Ещё факт</button>
    </div>
    <Transition name="fact-swap" mode="out-in">
      <div :key="index" class="fact__body">
        <svg class="fact__picture" viewBox="0 0 100 80" aria-hidden="true">
          <line
            v-for="(edge, order) in picture.edges"
            :key="'edge-' + order"
            class="fact__edge"
            :x1="picture.points[edge[0]].x"
            :y1="picture.points[edge[0]].y"
            :x2="picture.points[edge[1]].x"
            :y2="picture.points[edge[1]].y"
            pathLength="1"
            :style="lineStyle(order)"
          />
          <circle
            v-for="(point, order) in picture.points"
            :key="'point-' + order"
            class="fact__point"
            :cx="point.x"
            :cy="point.y"
            r="4.5"
            :style="pointStyle(order)"
          />
        </svg>
        <p class="fact__title">{{ fact.title }}</p>
        <p class="fact__text">{{ fact.text }}</p>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.fact {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fact__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fact__label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.fact__more {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.fact__more:hover {
  text-decoration: underline;
}

.fact__more:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.fact__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fact__picture {
  width: 100%;
  height: 92px;
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--graph-canvas-bg);
}

.fact__edge {
  stroke: var(--graph-edge);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 1;
  animation: fact-draw 520ms var(--ease-out) backwards;
}

.fact__point {
  fill: var(--graph-vertex-fill);
  stroke: var(--color-accent);
  stroke-width: 1.6;
  transform-box: fill-box;
  transform-origin: center;
  animation: fact-pop 420ms var(--ease-spring) backwards;
}

.fact__title {
  margin: 0;
  font-weight: 700;
}

.fact__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.fact-swap-enter-active,
.fact-swap-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.fact-swap-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.fact-swap-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@keyframes fact-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fact-pop {
  from {
    transform: scale(0);
  }
}
</style>
