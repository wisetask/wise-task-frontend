<script setup lang="ts">
import { computed, ref } from "vue";
import { motionAllowed } from "@/shared/lib/motion";
import {
  buildCalendar,
  cellTitle,
  dateKey,
  solutionsWord,
  type CalendarCell,
  type DayActivity,
} from "../lib/activityCalendar";
import ActivityDays from "./ActivityDays.vue";

const props = withDefaults(
  defineProps<{
    days: DayActivity[];
    available: boolean;
    today?: Date;
  }>(),
  { today: () => new Date() },
);

const calendar = computed(() => buildCalendar(props.today, props.days));
const todayKey = computed(() => dateKey(props.today));

const heading = computed(() => {
  if (!props.available) {
    return "";
  }
  const total = calendar.value.total;
  return total + " " + solutionsWord(total) + " за последний год";
});

const note = computed(() => {
  if (!props.available) {
    return "Скоро здесь будет видно, в какие дни вы решали задачи.";
  }
  if (calendar.value.total === 0) {
    return "Решите первую задачу — и здесь загорится первая вершина.";
  }
  return "";
});

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const lively = computed(() => motionAllowed());
const hovered = ref<CalendarCell | null>(null);
const hoveredWeek = ref(-1);
const hoveredDay = ref(-1);

function onGridOver(event: MouseEvent) {
  if (!lively.value || !(event.target instanceof Element)) {
    return;
  }
  const cellElement = event.target.closest("[data-week]");
  if (!(cellElement instanceof HTMLElement)) {
    return;
  }
  const week = Number(cellElement.dataset.week);
  const day = Number(cellElement.dataset.day);
  if (week === hoveredWeek.value && day === hoveredDay.value) {
    return;
  }
  hoveredWeek.value = week;
  hoveredDay.value = day;
  hovered.value = calendar.value.weeks[week][day];
}

function onGridLeave() {
  hovered.value = null;
  hoveredWeek.value = -1;
  hoveredDay.value = -1;
}

const footerText = computed(() => {
  if (hovered.value !== null) {
    return cellTitle(hovered.value);
  }
  if (note.value !== "") {
    return note.value;
  }
  if (!lively.value) {
    return "";
  }
  return "Наведите на день, чтобы увидеть, сколько было решений";
});
</script>

<template>
  <div class="activity" :class="{ 'activity--still': !lively }">
    <p v-if="heading !== ''" class="activity__heading">{{ heading }}</p>

    <div class="activity__scroll">
      <div
        class="activity__grid"
        role="img"
        :aria-label="heading !== '' ? heading : 'Календарь активности за год'"
        @mouseover="onGridOver"
        @mouseleave="onGridLeave"
      >
        <span
          v-if="hoveredWeek >= 0"
          class="activity__column"
          :style="{ gridColumn: hoveredWeek + 2 }"
          aria-hidden="true"
        />
        <span
          v-for="month in calendar.months.slice(1)"
          :key="'divider-' + month.column"
          class="activity__divider"
          :style="{ gridColumn: month.column + 2 }"
          aria-hidden="true"
        />

        <span
          v-for="month in calendar.months"
          :key="month.label + month.column"
          class="activity__month"
          :style="{ gridColumn: month.column + 2 }"
          aria-hidden="true"
        >
          {{ month.label }}
        </span>

        <span
          v-for="(weekday, index) in WEEKDAYS"
          :key="'weekday-' + index"
          class="activity__weekday"
          :class="{
            'activity__weekday--weekend': index >= 5,
            'activity__weekday--hovered': index === hoveredDay,
          }"
          :style="{ gridRow: index + 2 }"
          aria-hidden="true"
        >
          {{ weekday }}
        </span>

        <ActivityDays :weeks="calendar.weeks" :today-key="todayKey" />
      </div>
    </div>

    <div class="activity__footer">
      <p class="activity__note" :class="{ 'activity__note--day': hovered !== null }">
        {{ footerText }}
      </p>
      <div class="activity__legend" aria-hidden="true">
        Меньше
        <span
          v-for="level in 5"
          :key="level"
          class="activity__cell"
          :class="'activity__cell--' + (level - 1)"
        />
        Больше
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.activity__heading {
  margin: 0;
  font-weight: 700;
}

.activity__scroll {
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.activity__grid {
  display: grid;
  grid-template-columns: 26px repeat(53, minmax(0, 1fr));
  grid-template-rows: 16px repeat(7, auto);
  gap: 3px;
  width: 100%;
  min-width: 560px;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(
      circle at 85% 0%,
      color-mix(in srgb, var(--color-accent) 10%, transparent),
      transparent 60%
    ),
    var(--graph-canvas-bg);
  box-sizing: border-box;
}

.activity__month {
  grid-row: 1;
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.activity__weekday {
  grid-column: 1;
  color: var(--color-text-muted);
  align-self: center;
  font-size: 10px;
  line-height: 1;
  transition: color var(--duration-fast) var(--ease-out);
}

.activity__weekday--weekend {
  opacity: 0.6;
}

.activity__weekday--hovered {
  color: var(--color-accent);
  font-weight: 700;
  opacity: 1;
}

/* Граница месяца: пунктир перед первой неделей, в которой есть его первое число */
.activity__divider {
  grid-row: 2 / 9;
  margin-left: -2px;
  border-left: 1px dashed color-mix(in srgb, var(--graph-edge) 35%, transparent);
  pointer-events: none;
}

/* Неделя под курсором */
.activity__column {
  grid-row: 1 / 9;
  margin: 0 -1px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  pointer-events: none;
}

/* Клетка — место под вершину. Сама вершина — ::before, рёбра — вложенные .activity__edge */
.activity :deep(.activity__cell) {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  animation: activity-in 360ms var(--ease-out) backwards;
}

.activity :deep(.activity__cell::before) {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 22%;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--graph-edge) 40%, transparent);
  background: transparent;
  transition:
    inset var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.activity :deep(.activity__cell--1::before),
.activity :deep(.activity__cell--2::before),
.activity :deep(.activity__cell--3::before),
.activity :deep(.activity__cell--4::before) {
  inset: 12%;
}

.activity :deep(.activity__cell--1::before),
.activity :deep(.activity__cell--2::before),
.activity :deep(.activity__cell--3::before),
.activity :deep(.activity__cell--4::before) {
  border-color: transparent;
}

.activity :deep(.activity__cell--1::before) {
  background: color-mix(in srgb, var(--color-accent) 30%, var(--graph-vertex-fill));
}

.activity :deep(.activity__cell--2::before) {
  background: color-mix(in srgb, var(--color-accent) 55%, var(--graph-vertex-fill));
}

.activity :deep(.activity__cell--3::before) {
  background: color-mix(in srgb, var(--color-accent) 80%, var(--graph-vertex-fill));
}

.activity :deep(.activity__cell--4::before) {
  background: var(--color-accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--color-accent) 60%, transparent);
}

/* Сегодня — синее кольцо вокруг вершины с мягким ореолом, в цвет остального календаря */
.activity :deep(.activity__cell--today::after) {
  content: "";
  position: absolute;
  z-index: 2;
  inset: -1px;
  border: 1.5px solid var(--color-accent);
  border-radius: 50%;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.activity:not(.activity--still) :deep(.activity__cell:hover::before) {
  inset: 0;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 25%, transparent);
}

/* Ребро от центра клетки до центра соседней: ширина клетки плюс зазор сетки */
.activity :deep(.activity__edge) {
  position: absolute;
  background: color-mix(in srgb, var(--color-accent) 28%, transparent);
}

.activity :deep(.activity__edge--right) {
  top: calc(50% - 1px);
  left: 50%;
  width: calc(100% + 3px);
  height: 2px;
}

.activity :deep(.activity__edge--down) {
  top: 50%;
  left: calc(50% - 1px);
  width: 2px;
  height: calc(100% + 3px);
}

.activity__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.activity__note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.activity__note--day {
  color: var(--color-text);
  font-weight: 600;
}

.activity__legend {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 11px;
}

.activity__legend .activity__cell {
  width: 12px;
  animation: none;
}

@keyframes activity-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .activity :deep(.activity__cell) {
    animation: none;
  }
}
</style>
