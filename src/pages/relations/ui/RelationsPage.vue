<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  generateRelation,
  pathsOfLength,
  pathWeight,
  power,
  type Matrix,
  type RelationKind,
} from "@/entities/relation";
import { UiButton, UiSegmented } from "@/shared/ui";
import { GraphCanvas, makeSelection } from "@/widgets/graph-editor";
import {
  countFilled,
  countMistakes,
  emptyAnswers,
  isSolved,
  RelationMatrix,
  type Answers,
  type CellPosition,
} from "@/widgets/relation-matrix";
import { pathSelection, relationToGraph } from "../lib/relationGraph";
import {
  DEFAULT_KIND,
  DEFAULT_PAIRS,
  DEFAULT_SIZE,
  defaultRelation,
  type GeneratedRelation,
} from "../lib/relationSetup";
import {
  describePaths,
  hoverHint,
  MAX_POWER,
  MIN_POWER,
  MULTIPLY_OPTIONS,
  powerOptions,
  powerTitle,
  progressText,
  toExponent,
  toMultiplyKind,
} from "../lib/relationText";
import RelationsSetup from "./RelationsSetup.vue";

const POWER_OPTIONS = powerOptions();

const relation = ref<Matrix>(defaultRelation());
const kind = ref<RelationKind>(DEFAULT_KIND);
// С чем сгенерировано текущее отношение: по этим числам делается «новое отношение»
const lastRequest = ref({ size: DEFAULT_SIZE, pairs: DEFAULT_PAIRS, kind: DEFAULT_KIND });

const multiplyValue = ref("classic");
const exponentValue = ref(String(MIN_POWER));
const answers = ref<Answers>(emptyAnswers(DEFAULT_SIZE));
const hovered = ref<CellPosition | null>(null);
// Меняется при каждом новом отношении: холст пересоздаётся и заново вписывает граф в окно
const graphKey = ref(0);

const multiplyKind = computed(() => toMultiplyKind(multiplyValue.value));
const exponent = computed(() => toExponent(exponentValue.value));
const size = computed(() => relation.value.length);

const graph = computed(() => relationToGraph(relation.value, kind.value));
const expected = computed(() => power(relation.value, exponent.value, multiplyKind.value));
const matrixTitle = computed(() => powerTitle(exponent.value));

const hoveredPaths = computed<number[][]>(() => {
  const cell = hovered.value;
  if (cell === null || cell.row >= size.value || cell.col >= size.value) {
    return [];
  }
  return pathsOfLength(relation.value, cell.row, cell.col, exponent.value);
});

const highlight = computed(() => {
  const parts = pathSelection(hoveredPaths.value, kind.value);
  return makeSelection(parts.vertexIds, parts.edgeIds);
});

const pathsLine = computed(() => {
  const cell = hovered.value;
  if (cell === null) {
    return hoverHint(exponent.value);
  }
  let weights: number[] | null = null;
  if (multiplyKind.value === "tropical") {
    weights = hoveredPaths.value.map((path) => pathWeight(relation.value, path));
  }
  return describePaths(cell.row, cell.col, hoveredPaths.value, exponent.value, weights);
});

const progressLine = computed(() => {
  const filled = countFilled(answers.value);
  const mistakes = countMistakes(answers.value, expected.value);
  return progressText(filled, size.value * size.value, mistakes);
});

const solved = computed(() => isSolved(answers.value, expected.value));
const isLastPower = computed(() => exponent.value >= MAX_POWER);

// Новое отношение, другое умножение или другая степень: ответы начинаются заново
watch([relation, multiplyKind, exponent], () => {
  answers.value = emptyAnswers(size.value);
  hovered.value = null;
});

function applyRelation(matrix: Matrix, newKind: RelationKind) {
  relation.value = matrix;
  kind.value = newKind;
  graphKey.value = graphKey.value + 1;
}

function onGenerate(result: GeneratedRelation) {
  lastRequest.value = { size: result.size, pairs: result.pairs, kind: result.kind };
  applyRelation(result.matrix, result.kind);
}

function onNext() {
  if (!isLastPower.value) {
    exponentValue.value = String(exponent.value + 1);
    return;
  }
  const request = lastRequest.value;
  const matrix = generateRelation(request.size, request.pairs, request.kind);
  if (matrix === null) {
    return;
  }
  applyRelation(matrix, request.kind);
  exponentValue.value = String(MIN_POWER);
}
</script>

<template>
  <main class="relations">
    <h1 class="relations__title">Отношения</h1>
    <p class="relations__lead">
      Возведите отношение в степень и заполните матрицу. Наведите на клетку, чтобы увидеть на графе
      пути, которые она считает.
    </p>

    <RelationsSetup @generate="onGenerate" />

    <div class="relations__work">
      <div class="relations__graph">
        <GraphCanvas :key="graphKey" :graph="graph" readonly :selection="highlight" />
      </div>

      <div class="relations__side">
        <div class="relations__controls">
          <UiSegmented v-model="multiplyValue" :options="MULTIPLY_OPTIONS" label="Вид умножения" />
          <UiSegmented v-model="exponentValue" :options="POWER_OPTIONS" label="Степень" />
        </div>

        <div class="relations__matrices">
          <RelationMatrix title="A" :values="relation" />
          <RelationMatrix
            v-model:answers="answers"
            :title="matrixTitle"
            editable
            :expected="expected"
            :show-result="true"
            :highlight="hovered"
            @hover="hovered = $event"
          />
        </div>

        <p class="relations__note">{{ pathsLine }}</p>
        <p class="relations__note" role="status">{{ progressLine }}</p>

        <div v-if="solved" class="relations__success" role="status">
          <strong class="relations__success-title">Верно!</strong>
          <UiButton variant="primary" @click="onNext">
            {{ isLastPower ? "Сгенерировать новое отношение" : "Следующая степень" }}
          </UiButton>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.relations {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 80rem;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
}

.relations__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.relations__lead {
  margin: 0;
  color: var(--color-text-muted);
}

.relations__work {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.relations__graph {
  height: 32rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--graph-canvas-bg);
}

.relations__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.relations__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.relations__matrices {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-5);
  overflow-x: auto;
}

.relations__note {
  min-height: 2.6em;
  margin: 0;
  color: var(--color-text-muted);
}

.relations__success {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.relations__success-title {
  color: var(--color-success);
  font-size: var(--font-size-lg);
}

@media (max-width: 56rem) {
  .relations__work {
    grid-template-columns: minmax(0, 1fr);
  }

  .relations__graph {
    height: 24rem;
  }
}
</style>
