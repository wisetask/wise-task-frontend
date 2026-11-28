<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  farewellFact,
  rimLetters,
  rimSize,
  wheelColoring,
  wheelFacts,
  wheelGraph,
} from "../lib/wheel";

const props = withDefaults(
  defineProps<{ firstName: string; initials: string; breaking?: boolean }>(),
  { breaking: false },
);

const SIZE = 170;
const CENTER = { x: SIZE / 2, y: SIZE / 2 };
const RADIUS = 66;

const rim = computed(() => rimSize(props.firstName));
const wheel = computed(() => wheelGraph(rim.value, CENTER, RADIUS));
const letters = computed(() => rimLetters(props.firstName, rim.value));
const coloring = computed(() => wheelColoring(rim.value));
const facts = computed(() => wheelFacts(rim.value));

const factIndex = ref(-1);
const colored = computed(() => factIndex.value === 0);
const fact = computed(() => {
  if (props.breaking) {
    return farewellFact(rim.value);
  }
  return factIndex.value === -1 ? "Нажмите на кружок" : facts.value[factIndex.value];
});

function nextFact() {
  factIndex.value = (factIndex.value + 1) % facts.value.length;
}

function rimDelay(index: number): string {
  return (index / rim.value) * 6 + "s";
}

const root = ref<HTMLElement | null>(null);
const visible = ref(true);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (root.value === null || typeof IntersectionObserver === "undefined") {
    return;
  }
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      visible.value = entry.isIntersecting;
    }
  });
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  if (observer !== null) {
    observer.disconnect();
  }
});

function driftStyle(index: number): Record<string, string> {
  const point = wheel.value.rim[index];
  const dx = ((point.x - CENTER.x) / RADIUS) * 34;
  const dy = ((point.y - CENTER.y) / RADIUS) * 34;
  return {
    "--dx": Math.round(dx) + "px",
    "--dy": Math.round(dy) + "px",
    transitionDelay: 200 + index * 40 + "ms",
  };
}

function colorDelay(index: number): string {
  return index * 60 + "ms";
}
</script>

<template>
  <div
    ref="root"
    class="wheel"
    :class="{ 'wheel--breaking': breaking, 'wheel--paused': !visible && !breaking }"
  >
    <div class="wheel__stage">
      <svg class="wheel__svg" :viewBox="'0 0 ' + SIZE + ' ' + SIZE" aria-hidden="true">
        <g class="wheel__turn" :class="{ 'wheel__turn--colored': colored }">
          <line
            v-for="(point, index) in wheel.rim"
            :key="'spoke-' + index"
            class="wheel__spoke"
            :x1="CENTER.x"
            :y1="CENTER.y"
            :x2="point.x"
            :y2="point.y"
          />
          <line
            v-for="(edge, index) in wheel.rimEdges"
            :key="'rim-' + index"
            class="wheel__edge"
            :style="{ transitionDelay: 250 + index * 40 + 'ms' }"
            :x1="wheel.rim[edge[0]].x"
            :y1="wheel.rim[edge[0]].y"
            :x2="wheel.rim[edge[1]].x"
            :y2="wheel.rim[edge[1]].y"
          />
          <g
            v-for="(point, index) in wheel.rim"
            :key="'vertex-' + index"
            class="wheel__drift"
            :style="driftStyle(index)"
          >
            <g
              class="wheel__vertex"
              :class="colored ? 'wheel__vertex--color-' + coloring.rim[index] : ''"
            >
              <circle
                class="wheel__dot"
                :cx="point.x"
                :cy="point.y"
                r="10.5"
                :style="{ animationDelay: rimDelay(index), transitionDelay: colorDelay(index) }"
              />
              <text
                class="wheel__letter"
                :x="point.x"
                :y="point.y"
                text-anchor="middle"
                dominant-baseline="central"
              >
                {{ letters[index] }}
              </text>
            </g>
          </g>
        </g>
      </svg>
      <button
        type="button"
        class="wheel__avatar"
        :disabled="breaking"
        :aria-label="'Показать факт о графе-колесе W' + (rim + 1)"
        :title="'Граф-колесо W' + (rim + 1) + ': по вершине на каждую букву имени'"
        @click="nextFact"
      >
        {{ initials }}
      </button>
    </div>
    <p class="wheel__fact" :class="{ 'wheel__fact--hint': factIndex === -1 }" aria-live="polite">
      {{ fact }}
    </p>
  </div>
</template>

<style scoped>
.wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 190px;
  flex-shrink: 0;
}

.wheel__stage {
  position: relative;
  width: 170px;
  height: 170px;
}

.wheel__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.wheel__turn {
  transform-box: view-box;
  transform-origin: 50% 50%;
  animation: wheel-turn 90s linear infinite;
}

.wheel__spoke {
  stroke: var(--graph-edge);
  stroke-width: 1.4;
  stroke-opacity: 0.35;
}

.wheel__edge {
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-opacity: 0.55;
}

.wheel__vertex {
  transform-box: fill-box;
  transform-origin: center;
  animation: wheel-turn 90s linear infinite reverse;
}

.wheel__dot {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: wheel-lit 6s var(--ease-out) infinite;
  transition:
    fill var(--duration) var(--ease-out),
    stroke var(--duration) var(--ease-out);
}

.wheel__letter {
  fill: var(--graph-vertex-text);
  font-size: 11px;
  font-weight: 800;
  pointer-events: none;
  user-select: none;
}

.wheel__turn--colored .wheel__dot {
  animation: none;
}

.wheel__vertex--color-1 .wheel__dot {
  fill: var(--graph-red-fill);
  stroke: var(--graph-red-stroke);
}

.wheel__vertex--color-2 .wheel__dot {
  fill: var(--graph-green-fill);
  stroke: var(--graph-green-stroke);
}

.wheel__vertex--color-3 .wheel__dot {
  fill: color-mix(in srgb, var(--graph-active) 22%, var(--graph-vertex-fill));
  stroke: var(--graph-active);
}

.wheel__avatar {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: var(--shadow-accent);
  color: var(--color-on-accent);
  font: inherit;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: transform var(--duration-fast) var(--ease-out);
}

.wheel__avatar:hover {
  transform: translate(-50%, -50%) scale(1.05);
}

.wheel__avatar:active {
  transform: translate(-50%, -50%) scale(0.96);
}

.wheel__avatar:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.wheel__fact {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: calc(1.3em * 3);
  margin: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: 1.3;
  text-align: center;
}

.wheel__fact--hint {
  color: var(--color-text-muted);
}

.wheel__spoke,
.wheel__edge {
  transition: stroke-opacity 360ms var(--ease-out);
}

.wheel__drift {
  transition:
    transform 600ms var(--ease-out),
    opacity 600ms var(--ease-out);
}

.wheel--paused .wheel__turn,
.wheel--paused .wheel__vertex,
.wheel--paused .wheel__dot,
.wheel--breaking .wheel__turn,
.wheel--breaking .wheel__vertex,
.wheel--breaking .wheel__dot {
  animation-play-state: paused;
}

.wheel--breaking .wheel__spoke {
  stroke-opacity: 0;
}

.wheel--breaking .wheel__edge {
  stroke-opacity: 0;
}

.wheel--breaking .wheel__drift {
  opacity: 0;
  transform: translate(var(--dx), var(--dy));
}

.wheel--breaking .wheel__avatar {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4);
  transition:
    transform 420ms var(--ease-out),
    opacity 420ms var(--ease-out);
}

@keyframes wheel-turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes wheel-lit {
  0%,
  12% {
    fill: color-mix(in srgb, var(--color-accent) 30%, var(--graph-vertex-fill));
    stroke: var(--color-accent);
    transform: scale(1.15);
  }
  30%,
  100% {
    fill: var(--graph-vertex-fill);
    stroke: var(--graph-vertex-stroke);
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wheel__turn,
  .wheel__vertex,
  .wheel__dot {
    animation: none;
  }
}
</style>
