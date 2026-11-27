<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { readConditionOpen, storeConditionOpen } from "../lib/conditionPanel";
import { descriptionParts } from "../lib/description";
import type { CheckMark } from "../lib/checkResult";
import type { TaskCheck, TaskView } from "../lib/taskView";
import TaskGraphPreview from "./TaskGraphPreview.vue";

const props = withDefaults(
  defineProps<{
    view: TaskView;
    hints: string[];
    marks?: Record<string, CheckMark>;
    checking?: boolean;
  }>(),
  {
    marks: () => ({}),
    checking: false,
  },
);

const graphTitleId = useId();
const checksTitleId = useId();
const open = ref(readConditionOpen());

const parts = computed(() => descriptionParts(props.view.description));

const toggleTitle = computed(() => (open.value ? "Свернуть условие" : "Показать условие"));

function checkStyle(index: number): Record<string, string> {
  return {
    "--pop-delay": 380 + index * 90 + "ms",
    "--wait-delay": index * 160 + "ms",
  };
}

function markOf(check: TaskCheck): string {
  const mark = props.marks[check.pluginId];
  if (mark === undefined) {
    return "";
  }
  return mark;
}

function checkClass(check: TaskCheck): Record<string, boolean> {
  const mark = markOf(check);
  return {
    "task-condition__check--ok": mark === "ok" && !props.checking,
    "task-condition__check--fail": mark === "fail" && !props.checking,
    "task-condition__check--busy": props.checking,
  };
}

function toggle() {
  open.value = !open.value;
  storeConditionOpen(open.value);
}
</script>

<template>
  <aside class="task-condition" :class="{ 'task-condition--closed': !open }">
    <button
      type="button"
      class="task-condition__toggle"
      :title="toggleTitle"
      :aria-label="toggleTitle"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 6 L9 12 L15 18" />
      </svg>
    </button>

    <button v-if="!open" type="button" class="task-condition__rail" @click="toggle">
      <span class="task-condition__rail-text">Условие · {{ view.name }}</span>
    </button>

    <div v-else class="task-condition__body">
      <div v-if="$slots.top" class="task-condition__top">
        <slot name="top" />
      </div>
      <div class="task-condition__meta">
        <span v-if="view.category !== ''" class="task-condition__category">
          {{ view.category }}
        </span>
        <span v-if="view.author !== ''" class="task-condition__author">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20 C5 15, 19 15, 20 20" />
          </svg>
          {{ view.author }}
        </span>
      </div>
      <h1 class="task-condition__name">{{ view.name }}</h1>
      <p class="task-condition__description">
        <template v-for="(part, index) in parts" :key="index">
          <a
            v-if="part.href !== ''"
            class="task-condition__link"
            :href="part.href"
            :title="part.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ part.text }}
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3 H3 V13 H13 V10 M9 3 H13 V7 M13 3 L7 9" />
            </svg>
          </a>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <ul v-if="hints.length > 0" class="task-condition__hints">
        <li v-for="hint in hints" :key="hint">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11 V16 M12 8 V8.5" />
          </svg>
          {{ hint }}
        </li>
      </ul>
      <section
        v-if="view.graph !== null"
        class="task-condition__section"
        :aria-labelledby="graphTitleId"
      >
        <h2 :id="graphTitleId" class="task-condition__title">Граф задачи</h2>
        <p v-if="view.skippedEdges > 0" class="task-condition__note">
          Часть рёбер не показана: редактор пока не умеет кратные рёбра.
        </p>
        <TaskGraphPreview :graph="view.graph" />
      </section>
      <section
        v-if="view.checks.length > 0"
        class="task-condition__section"
        :aria-labelledby="checksTitleId"
      >
        <h2 :id="checksTitleId" class="task-condition__title">Что проверяется</h2>
        <ol class="task-condition__checks">
          <li
            v-for="(item, index) in view.checks"
            :key="item.pluginId + item.text"
            class="task-condition__check"
            :class="checkClass(item)"
          >
            <span class="task-condition__check-number" :style="checkStyle(index)">
              <svg
                v-if="markOf(item) === 'ok' && !checking"
                key="ok"
                class="task-condition__check-icon"
                viewBox="0 0 16 16"
                aria-label="пройдена"
              >
                <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
              </svg>
              <svg
                v-else-if="markOf(item) === 'fail' && !checking"
                key="fail"
                class="task-condition__check-icon"
                viewBox="0 0 16 16"
                aria-label="не пройдена"
              >
                <path d="M4.5 4.5 L11.5 11.5 M11.5 4.5 L4.5 11.5" />
              </svg>
              <template v-else>{{ index + 1 }}</template>
            </span>
            {{ item.text }}
          </li>
        </ol>
      </section>
      <div v-if="$slots.bottom" class="task-condition__bottom">
        <slot name="bottom" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.task-condition {
  position: relative;
  flex: none;
  display: flex;
  width: 380px;
  min-height: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: width var(--duration) var(--ease-out);
}

.task-condition--closed {
  width: 52px;
}

.task-condition__toggle {
  position: absolute;
  top: var(--space-3);
  right: 10px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.task-condition__toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.task-condition__toggle:active {
  transform: scale(0.9);
}

.task-condition__toggle:hover svg {
  transform: translateX(-2px);
}

.task-condition--closed .task-condition__toggle:hover svg {
  transform: rotate(180deg) translateX(-2px);
}

.task-condition__toggle:focus-visible,
.task-condition__rail:focus-visible,
.task-condition__link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.task-condition__toggle svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.task-condition--closed .task-condition__toggle svg {
  transform: rotate(180deg);
}

.task-condition__rail {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 60px 0 var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  animation: task-condition-fade 320ms var(--ease-out) 120ms both;
  transition:
    background-color var(--duration) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.task-condition__rail:hover {
  background: var(--color-surface-hover);
  color: var(--color-accent);
}

.task-condition__rail-text {
  max-height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  writing-mode: vertical-rl;
}

.task-condition__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-4);
  overflow-y: auto;
}

.task-condition__body > * {
  animation: task-condition-rise 420ms var(--ease-out) both;
}

.task-condition__body > :nth-child(2) {
  animation-delay: 50ms;
}

.task-condition__body > :nth-child(3) {
  animation-delay: 100ms;
}

.task-condition__body > :nth-child(4) {
  animation-delay: 150ms;
}

.task-condition__body > :nth-child(5) {
  animation-delay: 200ms;
}

.task-condition__body > :nth-child(n + 6) {
  animation-delay: 250ms;
}

.task-condition__top {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding-right: 44px;
}

.task-condition__top + .task-condition__meta {
  min-height: 0;
  padding-right: 0;
}

.task-condition__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
  padding-right: 44px;
}

.task-condition__category {
  position: relative;
  overflow: hidden;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 600;
}

.task-condition__category::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -60%;
  width: 40%;
  background: linear-gradient(
    100deg,
    transparent,
    color-mix(in srgb, var(--color-surface) 70%, transparent),
    transparent
  );
  animation: task-condition-shine 900ms var(--ease-out) 500ms both;
}

.task-condition__author {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.task-condition__author svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.task-condition__name {
  margin: 0;
  font-size: var(--font-size-xl);
  line-height: 1.3;
}

.task-condition__description {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.task-condition__link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.task-condition__link:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
  transform: translateY(-1px);
}

.task-condition__link svg {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.task-condition__link:hover svg {
  transform: translate(1px, -1px);
}

.task-condition__hints {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  list-style: none;
}

.task-condition__hints li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.task-condition__hints svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-linecap: round;
  animation: task-condition-ping 700ms var(--ease-spring) 450ms both;
}

.task-condition__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.task-condition__bottom {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.task-condition__title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.task-condition__note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.task-condition__checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.task-condition__check {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--font-size-md);
  line-height: 1.45;
}

.task-condition__check {
  transition: color var(--duration) var(--ease-out);
}

.task-condition__check--busy .task-condition__check-number {
  animation: task-condition-wait 1s ease-in-out var(--wait-delay) infinite;
}

.task-condition__check--ok .task-condition__check-number {
  border-color: var(--color-success);
  background: var(--color-success);
  color: var(--color-on-accent);
}

.task-condition__check--fail {
  color: var(--color-danger);
}

.task-condition__check--fail .task-condition__check-number {
  border-color: var(--color-danger);
  background: var(--color-danger);
  color: var(--color-on-accent);
  animation: task-condition-jolt 420ms var(--ease-out);
}

.task-condition__check-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 18;
  animation: task-condition-tick 360ms var(--ease-out) var(--pop-delay) backwards;
}

.task-condition__check:hover .task-condition__check-number {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
  transform: scale(1.1);
}

.task-condition__check-number {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-page);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
  animation: task-condition-pop 420ms var(--ease-spring) var(--pop-delay) backwards;
  transition:
    background-color var(--duration) var(--ease-out),
    border-color var(--duration) var(--ease-out),
    color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

@keyframes task-condition-rise {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
}

@keyframes task-condition-wait {
  0%,
  100% {
    border-color: var(--color-border);
    transform: scale(1);
  }
  40% {
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: scale(1.18);
  }
}

@keyframes task-condition-jolt {
  25% {
    transform: translateX(-3px) rotate(-8deg);
  }
  75% {
    transform: translateX(3px) rotate(8deg);
  }
}

@keyframes task-condition-tick {
  from {
    stroke-dashoffset: 18;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes task-condition-fade {
  from {
    opacity: 0;
  }
}

@keyframes task-condition-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}

@keyframes task-condition-ping {
  from {
    opacity: 0;
    transform: scale(0.4) rotate(-30deg);
  }
}

@keyframes task-condition-shine {
  to {
    left: 120%;
  }
}

@media (max-width: 800px) {
  .task-condition {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .task-condition--closed {
    width: 100%;
    height: 52px;
  }

  .task-condition__rail-text {
    writing-mode: horizontal-tb;
  }

  .task-condition__rail {
    justify-content: flex-start;
    padding: var(--space-4);
  }
}
</style>
