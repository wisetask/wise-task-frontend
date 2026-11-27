<script setup lang="ts">
import { RouterLink } from "vue-router";
import type { FeedItem } from "../model/sideViews";

defineProps<{
  items: FeedItem[];
}>();

function rowDelay(index: number): string {
  return 250 + index * 90 + "ms";
}
</script>

<template>
  <ol class="feed">
    <li
      v-for="(item, index) in items"
      :key="item.id"
      class="feed__item"
      :style="{ animationDelay: rowDelay(index) }"
    >
      <RouterLink
        class="feed__link"
        :to="{ name: 'solution', params: { id: item.id } }"
        :title="item.taskName"
      >
        <span
          class="feed__dot"
          :class="[
            item.isCorrect ? 'feed__dot--ok' : 'feed__dot--fail',
            { 'feed__dot--newest': index === 0 },
          ]"
          aria-hidden="true"
        />
        <span class="feed__name">{{ item.taskName }}</span>
        <span class="feed__state">{{ item.isCorrect ? "верно" : "неверно" }}</span>
      </RouterLink>
    </li>
  </ol>
</template>

<style scoped>
.feed {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 0;
  padding: 0 0 0 10px;
  overflow: hidden;
  list-style: none;
}

.feed::before {
  content: "";
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 14px;
  width: 2px;
  background: linear-gradient(var(--color-accent), transparent);
  opacity: 0.5;
  transform-origin: top;
  animation: feed-line 900ms var(--ease-out) 200ms backwards;
}

.feed::after {
  content: "";
  position: absolute;
  right: 0;
  left: 0;
  height: 36px;
  background: linear-gradient(
    transparent,
    color-mix(in srgb, var(--color-accent) 10%, transparent),
    transparent
  );
  pointer-events: none;
  animation: feed-scan 4s ease-in-out 1.5s infinite;
}

.feed__item {
  animation: feed-in 360ms var(--ease-out) backwards;
}

.feed__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 30px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 12px;
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.feed__link:hover {
  background: var(--color-surface-hover);
  transform: translateX(3px);
}

.feed__link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.feed__dot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
}

.feed__dot--ok {
  background: var(--color-success);
}

.feed__dot--fail {
  background: var(--color-danger);
}

.feed__dot--newest {
  box-shadow: 0 0 0 0 var(--color-accent);
  animation: feed-newest 1.8s var(--ease-out) 1s infinite;
}

.feed__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed__state {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

@keyframes feed-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes feed-line {
  from {
    transform: scaleY(0);
  }
}

@keyframes feed-scan {
  0% {
    top: -36px;
  }
  100% {
    top: 100%;
  }
}

@keyframes feed-newest {
  from {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 70%, transparent);
  }
  to {
    box-shadow: 0 0 0 8px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed::after,
  .feed__dot--newest {
    animation: none !important;
  }
}
</style>
