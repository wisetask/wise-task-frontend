<script setup lang="ts">
import { computed, ref } from "vue";
import type { Matrix } from "@/entities/relation";
import {
  cellState,
  nextCell,
  parseCell,
  withAnswer,
  type Answers,
  type CellPosition,
} from "../lib/cells";

const props = withDefaults(
  defineProps<{
    title?: string;
    values?: Matrix | null;
    editable?: boolean;
    expected?: Matrix | null;
    showResult?: boolean;
    highlight?: CellPosition | null;
  }>(),
  {
    title: "",
    values: null,
    editable: false,
    expected: null,
    showResult: false,
    highlight: null,
  },
);

const answers = defineModel<Answers>("answers", { default: () => [] });

const emit = defineEmits<{
  hover: [cell: CellPosition | null];
}>();

const root = ref<HTMLElement | null>(null);

const size = computed(() => {
  if (props.editable) {
    return answers.value.length;
  }
  return props.values === null ? 0 : props.values.length;
});

const indices = computed(() => {
  const list: number[] = [];
  for (let i = 0; i < size.value; i++) {
    list.push(i);
  }
  return list;
});

function answerAt(row: number, col: number): number | null {
  return answers.value[row][col];
}

function textAt(row: number, col: number): string {
  const value = answerAt(row, col);
  return value === null ? "" : String(value);
}

function valueAt(row: number, col: number): number {
  return props.values === null ? 0 : props.values[row][col];
}

function isHighlighted(row: number, col: number): boolean {
  return props.highlight !== null && props.highlight.row === row && props.highlight.col === col;
}

function cellClasses(row: number, col: number) {
  const classes: string[] = [];
  if (props.editable) {
    const expected = props.expected === null ? null : props.expected[row][col];
    const state = cellState(answerAt(row, col), expected, props.showResult);
    classes.push("relation-matrix__cell--" + state);
  } else if (valueAt(row, col) === 0) {
    classes.push("relation-matrix__cell--zero");
  }
  if (isHighlighted(row, col)) {
    classes.push("relation-matrix__cell--highlight");
  }
  return classes;
}

function onInput(row: number, col: number, event: Event) {
  const input = event.target as HTMLInputElement;
  let value: number | null = null;
  if (input.value.trim() !== "") {
    value = parseCell(input.value);
    if (value === null) {
      input.value = textAt(row, col);
      return;
    }
  }
  answers.value = withAnswer(answers.value, { row: row, col: col }, value);
}

function focusCell(cell: CellPosition) {
  if (root.value === null) {
    return;
  }
  const selector = 'input[data-row="' + cell.row + '"][data-col="' + cell.col + '"]';
  const input = root.value.querySelector<HTMLInputElement>(selector);
  if (input !== null) {
    input.focus();
    input.select();
  }
}

function onKeyDown(row: number, col: number, event: KeyboardEvent) {
  const target = nextCell({ row: row, col: col }, event.key, size.value);
  if (target === null) {
    return;
  }
  event.preventDefault();
  focusCell(target);
}
</script>

<template>
  <figure ref="root" class="relation-matrix">
    <figcaption v-if="title !== ''" class="relation-matrix__title">{{ title }}</figcaption>
    <table class="relation-matrix__table" @mouseleave="emit('hover', null)">
      <thead>
        <tr>
          <th class="relation-matrix__corner" />
          <th v-for="col in indices" :key="col" scope="col" class="relation-matrix__head">
            {{ col + 1 }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in indices" :key="row">
          <th scope="row" class="relation-matrix__head">{{ row + 1 }}</th>
          <td
            v-for="col in indices"
            :key="col"
            class="relation-matrix__cell"
            :class="cellClasses(row, col)"
            @mouseenter="emit('hover', { row: row, col: col })"
          >
            <input
              v-if="editable"
              class="relation-matrix__input"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              :value="textAt(row, col)"
              :data-row="row"
              :data-col="col"
              :aria-label="'Строка ' + (row + 1) + ', столбец ' + (col + 1)"
              @input="onInput(row, col, $event)"
              @keydown="onKeyDown(row, col, $event)"
              @focus="emit('hover', { row: row, col: col })"
            />
            <span v-else>{{ valueAt(row, col) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.relation-matrix {
  display: inline-flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.relation-matrix__title {
  font-weight: 600;
}

.relation-matrix__table {
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.relation-matrix__head {
  width: var(--control-height-md);
  height: var(--control-height-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 400;
  text-align: center;
}

.relation-matrix__cell {
  width: var(--control-height-md);
  height: var(--control-height-md);
  padding: 0;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  text-align: center;
}

.relation-matrix__cell--zero {
  color: var(--color-text-muted);
}

.relation-matrix__cell--filled {
  background: var(--color-surface-muted);
}

.relation-matrix__cell--correct {
  background: var(--graph-green-fill);
}

.relation-matrix__cell--wrong {
  background: var(--graph-red-fill);
  color: var(--graph-red-stroke);
}

.relation-matrix__cell--highlight {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.relation-matrix__input {
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: center;
}

.relation-matrix__input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}
</style>
