<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { createStars, moveStars, starLinks, type Star } from "../model/constellation";

const STAR_COUNT = 18;
const LINK_DISTANCE = 130;
const POINTER_DISTANCE = 160;
const STAR_SEED = 42;

const root = ref<SVGSVGElement | null>(null);
const width = ref(800);
const height = ref(180);
const stars = shallowRef<Star[]>([]);
const pointer = ref<{ x: number; y: number } | null>(null);
let frame = 0;
let lastTime = 0;
let resizer: ResizeObserver | null = null;

const viewBox = computed(() => "0 0 " + width.value + " " + height.value);
const links = computed(() => starLinks(stars.value, LINK_DISTANCE));

const pointerLinks = computed(() => {
  const result: { index: number; strength: number }[] = [];
  if (pointer.value === null) {
    return result;
  }
  for (let index = 0; index < stars.value.length; index++) {
    const dx = stars.value[index].x - pointer.value.x;
    const dy = stars.value[index].y - pointer.value.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < POINTER_DISTANCE) {
      result.push({ index: index, strength: 1 - length / POINTER_DISTANCE });
    }
  }
  return result;
});

function measure() {
  if (root.value === null) {
    return;
  }
  const box = root.value.getBoundingClientRect();
  width.value = Math.max(Math.round(box.width), 1);
  height.value = Math.max(Math.round(box.height), 1);
}

function tick(now: number) {
  if (lastTime === 0) {
    lastTime = now;
  }
  const seconds = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (!document.hidden) {
    stars.value = moveStars(stars.value, seconds, width.value, height.value);
  }
  frame = window.requestAnimationFrame(tick);
}

function onPointerMove(event: PointerEvent) {
  if (root.value === null) {
    return;
  }
  const box = root.value.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  if (x < 0 || y < 0 || x > box.width || y > box.height) {
    pointer.value = null;
    return;
  }
  pointer.value = { x: x, y: y };
}

onMounted(() => {
  measure();
  stars.value = createStars(STAR_COUNT, width.value, height.value, STAR_SEED);
  if (typeof ResizeObserver === "function" && root.value !== null) {
    resizer = new ResizeObserver(measure);
    resizer.observe(root.value);
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  frame = window.requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frame);
  window.removeEventListener("pointermove", onPointerMove);
  if (resizer !== null) {
    resizer.disconnect();
  }
});
</script>

<template>
  <svg ref="root" class="constellation" :viewBox="viewBox" aria-hidden="true">
    <line
      v-for="link in links"
      :key="link.from + '-' + link.to"
      class="constellation__link"
      :x1="stars[link.from].x"
      :y1="stars[link.from].y"
      :x2="stars[link.to].x"
      :y2="stars[link.to].y"
      :style="{ opacity: link.strength * 0.55 }"
    />
    <template v-if="pointer !== null">
      <line
        v-for="link in pointerLinks"
        :key="'pointer-' + link.index"
        class="constellation__link constellation__link--pointer"
        :x1="pointer.x"
        :y1="pointer.y"
        :x2="stars[link.index].x"
        :y2="stars[link.index].y"
        :style="{ opacity: link.strength * 0.8 }"
      />
    </template>
    <circle
      v-for="(star, index) in stars"
      :key="index"
      class="constellation__star"
      :cx="star.x"
      :cy="star.y"
      r="2.6"
    />
  </svg>
</template>

<style scoped>
.constellation {
  display: block;
  animation: constellation-in 1.2s var(--ease-out) backwards;
  mask-image: radial-gradient(ellipse at center, black 35%, transparent 78%);
}

.constellation__link {
  stroke: var(--graph-edge);
  stroke-width: 1;
}

.constellation__link--pointer {
  stroke: var(--color-accent);
}

.constellation__star {
  fill: var(--graph-vertex-stroke);
  opacity: 0.7;
}

@keyframes constellation-in {
  from {
    opacity: 0;
  }
}
</style>
