<script setup lang="ts">
import { cellTitle, type CalendarCell } from "../lib/activityCalendar";

defineProps<{ weeks: (CalendarCell | null)[][]; todayKey: string }>();
</script>

<template>
  <template v-for="(week, weekIndex) in weeks" :key="'week-' + weekIndex">
    <template v-for="(cell, dayIndex) in week" :key="'day-' + weekIndex + '-' + dayIndex">
      <span
        v-if="cell !== null"
        class="activity__cell"
        :class="[
          'activity__cell--' + cell.level,
          { 'activity__cell--today': cell.date === todayKey },
        ]"
        :style="{
          gridColumn: weekIndex + 2,
          gridRow: dayIndex + 2,
          animationDelay: weekIndex * 12 + 'ms',
        }"
        :data-week="weekIndex"
        :data-day="dayIndex"
        :title="cellTitle(cell)"
      >
        <span v-if="cell.linkRight" class="activity__edge activity__edge--right" />
        <span v-if="cell.linkDown" class="activity__edge activity__edge--down" />
      </span>
    </template>
  </template>
</template>
