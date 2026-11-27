<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/entities/user";
import { UiButton } from "@/shared/ui";
import { GraphCanvas } from "@/widgets/graph-editor";
import {
  checkMarks,
  CheckResultNotice,
  handOffAnswer,
  loadTaskAttempts,
  TaskCondition,
} from "@/widgets/task-view";
import { isSolutionMissing, loadSolutionErrorText } from "../model/errors";
import { attemptPlace, diffSummary, graphDiff } from "../model/graphDiff";
import { useSolution } from "../model/useSolution";
import GraphDiffView from "./GraphDiffView.vue";

const NAV_DOTS = 12;
const FLASH_TIME = 1300;

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { view, answer, result, isUnsupported, loading, error, load } = useSolution();

const canvas = ref<InstanceType<typeof GraphCanvas> | null>(null);
const showDiff = ref(false);
const attemptIds = ref<string[]>([]);
const attemptOk = ref<Record<string, boolean>>({});
const resultKey = ref(0);
const flash = ref("");
let attemptsTask = "";
let flashTimer = 0;

const solutionId = computed(() => String(route.params.id));
const userId = computed(() => (userStore.user === null ? "" : userStore.user.id));
const place = computed(() => attemptPlace(attemptIds.value, solutionId.value));
const marks = computed(() => (view.value === null ? {} : checkMarks(view.value, result.value)));

const diff = computed(() => {
  if (view.value === null || view.value.graph === null || answer.value === null) {
    return null;
  }
  return graphDiff(view.value.graph, answer.value);
});

const diffLines = computed(() => (diff.value === null ? [] : diffSummary(diff.value.counts)));

const navIds = computed(() => {
  const ids = attemptIds.value;
  if (place.value === null || ids.length <= NAV_DOTS) {
    return ids;
  }
  let start = place.value.index - Math.floor(NAV_DOTS / 2);
  start = Math.max(0, Math.min(start, ids.length - NAV_DOTS));
  return ids.slice(start, start + NAV_DOTS);
});

watch(solutionId, (id) => load(id), { immediate: true });

watch(
  answer,
  (now, before) => {
    if (before !== null && now !== null && canvas.value !== null) {
      canvas.value.expectJump(before);
    }
  },
  { flush: "pre" },
);

watch(answer, (now, before) => {
  if (before !== null && now !== null) {
    nextTick(() => {
      if (canvas.value !== null) {
        canvas.value.fitView();
      }
    });
  }
});

watch(result, (value) => {
  if (value === null) {
    return;
  }
  resultKey.value = resultKey.value + 1;
  window.clearTimeout(flashTimer);
  flash.value = value.isCorrect ? "ok" : "fail";
  flashTimer = window.setTimeout(() => {
    flash.value = "";
  }, FLASH_TIME);
});

watch(view, refreshAttempts);
watch(userId, refreshAttempts);

async function refreshAttempts() {
  if (view.value === null || userId.value === "") {
    return;
  }
  if (view.value.id === attemptsTask && attemptIds.value.includes(solutionId.value)) {
    return;
  }
  attemptsTask = view.value.id;
  const items = await loadTaskAttempts(view.value.id, userId.value);
  if (items === null) {
    return;
  }
  const ids: string[] = [];
  const ok: Record<string, boolean> = {};
  for (const item of items) {
    ids.push(item.id);
    ok[item.id] = item.isCorrect;
  }
  attemptIds.value = ids;
  attemptOk.value = ok;
}

function goTo(id: string | null) {
  if (id !== null) {
    router.push({ name: "solution", params: { id: id } });
  }
}

function continueFromHere() {
  if (view.value === null || answer.value === null) {
    return;
  }
  handOffAnswer(view.value.id, answer.value);
  router.push({ name: "task", params: { id: view.value.id } });
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function onKeydown(event: KeyboardEvent) {
  if (place.value === null || isTyping(event.target) || event.ctrlKey || event.metaKey) {
    return;
  }
  if (event.key === "ArrowLeft") {
    goTo(place.value.previous);
  } else if (event.key === "ArrowRight") {
    goTo(place.value.next);
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  window.clearTimeout(flashTimer);
});
</script>

<template>
  <main class="solution-page">
    <p v-if="view === null && loading" class="solution-page__message">
      <span class="solution-page__loader" aria-hidden="true"><span /><span /><span /></span>
      Загружаю решение…
    </p>
    <div
      v-else-if="error !== null"
      class="solution-page__message solution-page__message--error"
      role="alert"
    >
      <span>{{ loadSolutionErrorText(error) }}</span>
      <RouterLink v-if="isSolutionMissing(error)" :to="{ name: 'solutions' }">
        К моим решениям
      </RouterLink>
      <UiButton v-else size="sm" @click="load(solutionId)">Повторить</UiButton>
    </div>
    <p v-else-if="isUnsupported" class="solution-page__message">
      Это решение задачи на написание кода или задачи, которой больше нет. Такие решения новый сайт
      пока не открывает.
    </p>

    <div v-else-if="view !== null" class="solution-page__body">
      <TaskCondition :view="view" :hints="[]" :marks="marks">
        <template #top>
          <RouterLink class="solution-page__back" :to="{ name: 'solutions' }">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6 L9 12 L15 18" />
            </svg>
            Мои решения
          </RouterLink>
        </template>
      </TaskCondition>

      <section class="solution-page__answer" aria-labelledby="solution-page-answer-title">
        <h2 id="solution-page-answer-title" class="solution-page__hidden-title">Ваше решение</h2>
        <div class="solution-page__stage" :class="{ 'solution-page__stage--busy': loading }">
          <Transition name="solution-swap" mode="out-in">
            <GraphDiffView v-if="showDiff && diff !== null" key="diff" :diff="diff" />
            <div v-else-if="answer !== null" key="canvas" class="solution-page__canvas">
              <GraphCanvas ref="canvas" :graph="answer" readonly />
            </div>
            <p v-else key="none" class="solution-page__none">Граф решения не нашёлся на сервере.</p>
          </Transition>

          <nav v-if="place !== null" class="solution-page__nav" aria-label="Попытки по этой задаче">
            <button
              type="button"
              class="solution-page__arrow"
              :disabled="place.previous === null"
              title="Предыдущая попытка (←)"
              aria-label="Предыдущая попытка"
              @click="goTo(place.previous)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 L9 12 L15 18" /></svg>
            </button>
            <div class="solution-page__nav-middle">
              <span class="solution-page__nav-text">
                Попытка {{ place.index + 1 }} из {{ place.total }}
              </span>
              <span class="solution-page__nav-dots">
                <RouterLink
                  v-for="id in navIds"
                  :key="id"
                  class="solution-page__nav-dot"
                  :class="{
                    'solution-page__nav-dot--ok': attemptOk[id] === true,
                    'solution-page__nav-dot--current': id === solutionId,
                  }"
                  :to="{ name: 'solution', params: { id: id } }"
                  :aria-label="'Попытка ' + (attemptIds.indexOf(id) + 1)"
                />
              </span>
            </div>
            <button
              type="button"
              class="solution-page__arrow"
              :disabled="place.next === null"
              title="Следующая попытка (→)"
              aria-label="Следующая попытка"
              @click="goTo(place.next)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 L15 12 L9 18" /></svg>
            </button>
          </nav>

          <div class="solution-page__tools">
            <button
              v-if="diff !== null"
              type="button"
              class="solution-page__tool"
              :class="{ 'solution-page__tool--on': showDiff }"
              :aria-pressed="showDiff"
              @click="showDiff = !showDiff"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4 V20 M17 4 V20 M4 8 H10 M14 16 H20" />
              </svg>
              Что я изменил
            </button>
            <button
              v-if="answer !== null"
              type="button"
              class="solution-page__tool"
              @click="continueFromHere"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12 H19 M13 6 L19 12 L13 18" />
              </svg>
              Продолжить с этого графа
            </button>
            <RouterLink
              class="solution-page__tool solution-page__tool--main"
              :to="{ name: 'task', params: { id: view.id } }"
            >
              Решить заново
            </RouterLink>
          </div>

          <Transition name="solution-card">
            <ul v-if="showDiff && diff !== null" class="solution-page__diff-text">
              <li v-for="line in diffLines" :key="line">{{ line }}</li>
            </ul>
          </Transition>

          <Transition name="solution-card" mode="out-in">
            <CheckResultNotice
              v-if="result !== null"
              :key="resultKey"
              class="solution-page__result"
              :result="result"
              success-title="Решение верное"
              failure-title="Решение неверное"
            />
          </Transition>

          <div
            v-if="flash !== ''"
            :key="'flash-' + resultKey"
            class="solution-page__flash"
            :class="'solution-page__flash--' + flash"
            aria-hidden="true"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.solution-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.solution-page__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) auto;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  animation: solution-rise 360ms var(--ease-out) backwards;
}

.solution-page__message--error {
  border-style: solid;
  background: var(--graph-red-fill);
  color: var(--color-text);
}

.solution-page__loader {
  display: flex;
  gap: 6px;
}

.solution-page__loader span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: solution-hop 900ms ease-in-out infinite;
}

.solution-page__loader span:nth-child(2) {
  animation-delay: 150ms;
}

.solution-page__loader span:nth-child(3) {
  animation-delay: 300ms;
}

.solution-page__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.solution-page__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px var(--space-2) 4px 4px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.solution-page__back:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.solution-page__back svg,
.solution-page__arrow svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.solution-page__back:hover svg {
  transform: translateX(-3px);
}

.solution-page__answer {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.solution-page__hidden-title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.solution-page__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--graph-canvas-bg);
}

.solution-page__canvas {
  height: 100%;
  transition: opacity var(--duration) var(--ease-out);
}

.solution-page__stage--busy .solution-page__canvas {
  opacity: 0.55;
}

.solution-page__none {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  color: var(--color-text-muted);
}

.solution-page__nav {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: solution-rise 420ms var(--ease-out) 100ms backwards;
}

.solution-page__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.solution-page__arrow:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.solution-page__arrow:hover:not(:disabled) svg {
  transform: scale(1.2);
}

.solution-page__arrow:disabled {
  cursor: default;
  opacity: 0.35;
}

.solution-page__nav-middle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 var(--space-1);
}

.solution-page__nav-text {
  font-size: var(--font-size-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.solution-page__nav-dots {
  display: flex;
  gap: 4px;
}

.solution-page__nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  opacity: 0.55;
  transition:
    width var(--duration) var(--ease-spring),
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.solution-page__nav-dot--ok {
  background: var(--color-success);
}

.solution-page__nav-dot--current {
  width: 20px;
  border-radius: 4px;
  opacity: 1;
}

.solution-page__nav-dot:hover {
  opacity: 1;
  transform: scale(1.3);
}

.solution-page__tools {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  max-width: calc(100% - 300px);
  animation: solution-rise 420ms var(--ease-out) 160ms backwards;
}

.solution-page__tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-sm);
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.solution-page__tool:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.solution-page__tool svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.solution-page__tool:hover svg {
  transform: translateX(2px);
}

.solution-page__tool--on {
  border-color: var(--graph-active);
  background: color-mix(in srgb, var(--graph-active) 18%, var(--color-surface));
}

.solution-page__tool--main {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.solution-page__back:focus-visible,
.solution-page__arrow:focus-visible,
.solution-page__nav-dot:focus-visible,
.solution-page__tool:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.solution-page__diff-text {
  position: absolute;
  bottom: var(--space-4);
  left: var(--space-4);
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--graph-active);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  font-size: var(--font-size-sm);
  list-style: none;
}

.solution-page__result {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 5;
  width: 360px;
  max-width: calc(100% - 32px);
  max-height: 55%;
  overflow-y: auto;
}

.solution-page__flash {
  position: absolute;
  inset: 0;
  z-index: 4;
  opacity: 0;
  pointer-events: none;
  animation: solution-flash 1.2s var(--ease-out) both;
}

.solution-page__flash--ok {
  box-shadow:
    inset 0 0 0 3px var(--color-success),
    inset 0 0 110px color-mix(in srgb, var(--color-success) 28%, transparent);
}

.solution-page__flash--fail {
  box-shadow:
    inset 0 0 0 2px var(--color-danger),
    inset 0 0 90px color-mix(in srgb, var(--color-danger) 24%, transparent);
}

.solution-swap-enter-active,
.solution-swap-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.solution-swap-enter-from,
.solution-swap-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

.solution-card-enter-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform 380ms var(--ease-spring);
}

.solution-card-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.solution-card-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.94);
}

.solution-card-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes solution-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes solution-hop {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

@keyframes solution-flash {
  15% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@media (max-width: 800px) {
  .solution-page__body {
    flex-direction: column;
  }

  .solution-page__tools {
    top: auto;
    bottom: var(--space-4);
    left: var(--space-4);
    max-width: none;
    justify-content: flex-start;
  }
}
</style>
