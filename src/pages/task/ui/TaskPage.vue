<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { useUserStore } from "@/entities/user";
import { rememberRecentTask } from "@/shared/lib/recentTasks";
import { UiButton, UiCheckbox } from "@/shared/ui";
import { GraphEditor } from "@/widgets/graph-editor";
import {
  canPickDirection,
  checkMarks,
  CheckResultNotice,
  startAnswer,
  takeHandedAnswer,
  TaskCondition,
  taskHints,
} from "@/widgets/task-view";
import { burstSparks, emptyGraphNote, repeatJoke, successTitle } from "../model/checkMotion";
import { isTaskMissing, loadTaskErrorText, solveErrorText } from "../model/errors";
import { useSolve } from "../model/useSolve";
import { useTask } from "../model/useTask";
import { useAttempts, useNextTask } from "../model/useTaskExtras";
import TaskAttempts from "./TaskAttempts.vue";

const SPARKS = burstSparks(18);
const FLASH_TIME = 1400;
const SPIN_TIME = 600;

const route = useRoute();
const { view, isUnsupported, loading, error, load } = useTask();
const { checking, result, error: checkError, check, clear } = useSolve();
const userStore = useUserStore();
const { attempts, total: attemptCount, load: loadAttempts } = useAttempts();
const { next: nextTask, load: loadNextTask } = useNextTask();

const userId = computed(() => (userStore.user === null ? "" : userStore.user.id));

const answer = ref<Graph>(createEmptyGraph(false));
const answerKey = ref(0);
const repeats = ref(0);
const successes = ref(0);
const resultKey = ref(0);
const flash = ref("");
const flashKey = ref(0);
const spinning = ref(false);
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);
let flashTimer = 0;
let spinTimer = 0;

const taskId = computed(() => String(route.params.id));
const hints = computed(() => (view.value === null ? [] : taskHints(view.value)));
const canPick = computed(() => view.value !== null && canPickDirection(view.value));
const checkErrorText = computed(() => {
  if (checkError.value === null) {
    return "";
  }
  return solveErrorText(checkError.value);
});

const marks = computed(() => (view.value === null ? {} : checkMarks(view.value, result.value)));
const solved = computed(() => result.value !== null && result.value.isCorrect);
const successText = computed(() => successTitle(Math.max(successes.value - 1, 0)));

const note = computed(() => {
  if (result.value === null || result.value.isCorrect) {
    return "";
  }
  const joke = repeatJoke(repeats.value);
  if (joke !== "") {
    return joke;
  }
  return emptyGraphNote(answer.value.vertices.length);
});

const checkLabel = computed(() => {
  if (checking.value) {
    return "Проверяю";
  }
  if (solved.value) {
    return "Решено верно";
  }
  return "Проверить решение";
});

watch(taskId, (id) => load(id), { immediate: true });

watch(view, (value) => {
  restartAnswer();
  if (value !== null) {
    rememberRecentTask({ id: value.id, name: value.name });
    const handed = takeHandedAnswer(value.id);
    if (handed !== null) {
      answer.value = handed;
      answerKey.value = answerKey.value + 1;
    }
  }
  refreshAttempts();
});

watch(answer, () => {
  clear();
  repeats.value = 0;
});

function refreshAttempts() {
  if (view.value !== null) {
    loadAttempts(view.value.id, userId.value);
  }
}

watch(userId, refreshAttempts);

watch(result, (value) => {
  if (value === null) {
    return;
  }
  resultKey.value = resultKey.value + 1;
  refreshAttempts();
  if (value.isCorrect) {
    if (view.value !== null) {
      loadNextTask(view.value.id, view.value.category);
    }
    successes.value = successes.value + 1;
    showFlash("success");
    if (editor.value !== null) {
      editor.value.playWave();
    }
  } else {
    showFlash("error");
  }
});

function showFlash(kind: string) {
  window.clearTimeout(flashTimer);
  flash.value = kind;
  flashKey.value = flashKey.value + 1;
  flashTimer = window.setTimeout(() => {
    flash.value = "";
  }, FLASH_TIME);
}

function restartAnswer() {
  if (view.value === null) {
    return;
  }
  answer.value = startAnswer(view.value);
  answerKey.value = answerKey.value + 1;
}

function onRestart() {
  restartAnswer();
  window.clearTimeout(spinTimer);
  spinning.value = true;
  spinTimer = window.setTimeout(() => {
    spinning.value = false;
  }, SPIN_TIME);
}

function onPickAttempt(graph: Graph) {
  if (editor.value !== null) {
    editor.value.replaceGraph(graph);
  }
}

function onDirectedChange(isDirected: boolean) {
  answer.value = setDirected(answer.value, isDirected);
}

function onCheck() {
  if (view.value === null || checking.value) {
    return;
  }
  if (result.value !== null && !result.value.isCorrect) {
    repeats.value = repeats.value + 1;
    showFlash("error");
    return;
  }
  check(view.value, answer.value);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    onCheck();
  }
}

function sparkStyle(index: number): Record<string, string> {
  const spark = SPARKS[index];
  return {
    "--dx": spark.dx + "px",
    "--dy": spark.dy + "px",
    width: spark.size + "px",
    height: spark.size + "px",
    animationDelay: spark.delay + "ms",
  };
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  window.clearTimeout(flashTimer);
  window.clearTimeout(spinTimer);
});
</script>

<template>
  <main class="task-page">
    <p v-if="loading" class="task-page__message">
      <span class="task-page__loader" aria-hidden="true"> <span /><span /><span /> </span>
      Загружаю задачу…
    </p>
    <div
      v-else-if="error !== null"
      class="task-page__message task-page__message--error"
      role="alert"
    >
      <span>{{ loadTaskErrorText(error) }}</span>
      <RouterLink v-if="isTaskMissing(error)" :to="{ name: 'tasks' }">К списку задач</RouterLink>
      <UiButton v-else size="sm" @click="load(taskId)">Повторить</UiButton>
    </div>
    <p v-else-if="isUnsupported" class="task-page__message">
      Это задача на написание кода. Такие задачи новый сайт пока не открывает.
    </p>

    <div v-else-if="view !== null" class="task-page__body">
      <TaskCondition :view="view" :hints="hints" :marks="marks" :checking="checking">
        <template #top>
          <RouterLink class="task-page__back" :to="{ name: 'tasks' }">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6 L9 12 L15 18" />
            </svg>
            Все задачи
          </RouterLink>
        </template>
        <template v-if="userId !== ''" #bottom>
          <TaskAttempts :attempts="attempts" :total="attemptCount" @pick="onPickAttempt" />
        </template>
      </TaskCondition>

      <section class="task-page__answer" aria-labelledby="task-page-answer-title">
        <h2 id="task-page-answer-title" class="task-page__hidden-title">Ваш ответ</h2>
        <GraphEditor
          ref="editor"
          :key="answerKey"
          v-model:graph="answer"
          :rules="view.rules"
          class="task-page__editor"
        >
          <template #tools>
            <div class="task-page__tools">
              <UiCheckbox
                v-if="canPick"
                :model-value="answer.isDirected"
                label="Ориентированный"
                @update:model-value="onDirectedChange"
              />
              <span v-if="canPick" class="task-page__divider" aria-hidden="true" />
              <button
                type="button"
                class="task-page__tool"
                :class="{ 'task-page__tool--spin': spinning }"
                title="Вернуть ответ к началу"
                @click="onRestart"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12 A8 8 0 1 0 6.5 6.2" />
                  <path d="M4 4 V9 H9" />
                </svg>
                Заново
              </button>
            </div>
          </template>

          <template #actions>
            <div class="task-page__check">
              <Transition name="task-page-card" mode="out-in">
                <CheckResultNotice
                  v-if="result !== null"
                  :key="resultKey"
                  class="task-page__result"
                  :result="result"
                  :success-title="successText"
                  :note="note"
                  closable
                  @close="clear"
                >
                  <template v-if="result.isCorrect" #actions>
                    <RouterLink
                      v-if="nextTask !== null"
                      class="task-page__next"
                      :to="{ name: 'task', params: { id: nextTask.id } }"
                      :title="nextTask.name"
                    >
                      <span class="task-page__next-words">
                        <span class="task-page__next-label">Следующая задача</span>
                        <span class="task-page__next-name">{{ nextTask.name }}</span>
                      </span>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12 H19 M13 6 L19 12 L13 18" />
                      </svg>
                    </RouterLink>
                    <RouterLink class="task-page__to-list" :to="{ name: 'tasks' }">
                      К списку задач
                    </RouterLink>
                  </template>
                </CheckResultNotice>
                <div
                  v-else-if="checkErrorText !== ''"
                  key="error"
                  class="task-page__check-error"
                  role="alert"
                >
                  {{ checkErrorText }}
                </div>
              </Transition>

              <div class="task-page__check-row">
                <span
                  v-if="flash === 'success'"
                  :key="flashKey"
                  class="task-page__sparks"
                  aria-hidden="true"
                >
                  <span
                    v-for="(spark, index) in SPARKS"
                    :key="index"
                    class="task-page__spark"
                    :class="'task-page__spark--' + spark.color"
                    :style="sparkStyle(index)"
                  />
                </span>
                <button
                  type="button"
                  class="task-page__check-button"
                  :class="{
                    'task-page__check-button--busy': checking,
                    'task-page__check-button--solved': solved && !checking,
                    'task-page__check-button--shake-a': flash === 'error' && flashKey % 2 === 0,
                    'task-page__check-button--shake-b': flash === 'error' && flashKey % 2 === 1,
                  }"
                  :aria-busy="checking"
                  title="Проверить решение (Ctrl+Enter)"
                  @click="onCheck"
                >
                  <span class="task-page__check-icon" aria-hidden="true">
                    <span v-if="checking" class="task-page__check-dots">
                      <span /><span /><span />
                    </span>
                    <svg v-else-if="solved" viewBox="0 0 24 24">
                      <path d="M5 12.5 L10 17.5 L19 7" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24">
                      <circle cx="6" cy="17" r="2.5" />
                      <circle cx="12" cy="7" r="2.5" />
                      <circle cx="18" cy="17" r="2.5" />
                      <path d="M7.3 14.8 L10.7 9.2 M13.3 9.2 L16.7 14.8 M8.5 17 H15.5" />
                    </svg>
                  </span>
                  {{ checkLabel }}
                </button>
              </div>
            </div>
          </template>
        </GraphEditor>

        <div
          v-if="flash !== ''"
          :key="'flash-' + flashKey"
          class="task-page__flash"
          :class="'task-page__flash--' + flash"
          aria-hidden="true"
        />
        <div v-if="checking" class="task-page__scan" aria-hidden="true" />
      </section>
    </div>
  </main>
</template>

<style scoped>
.task-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-page__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) auto;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  animation: task-page-rise 360ms var(--ease-out) both;
}

.task-page__message--error {
  border-style: solid;
  background: var(--graph-red-fill);
  color: var(--color-text);
}

.task-page__loader {
  display: flex;
  gap: 6px;
}

.task-page__loader span,
.task-page__check-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: task-page-hop 900ms ease-in-out infinite;
}

.task-page__loader span {
  color: var(--color-accent);
}

.task-page__loader span:nth-child(2),
.task-page__check-dots span:nth-child(2) {
  animation-delay: 150ms;
}

.task-page__loader span:nth-child(3),
.task-page__check-dots span:nth-child(3) {
  animation-delay: 300ms;
}

.task-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.task-page__back {
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

.task-page__back:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.task-page__back svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.task-page__back:hover svg {
  transform: translateX(-3px);
}

.task-page__back:focus-visible,
.task-page__tool:focus-visible,
.task-page__check-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.task-page__answer {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.task-page__hidden-title {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.task-page__editor {
  flex: 1;
  min-height: 0;
}

.task-page__tools {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 42px;
  padding: 0 4px 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  font-size: var(--font-size-sm);
}

.task-page__divider {
  width: 1px;
  height: 22px;
  background: var(--color-border);
}

.task-page__tool {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 var(--space-3) 0 var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.task-page__tool:hover {
  background: var(--color-surface-hover);
}

.task-page__tool svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.task-page__tool:hover svg {
  transform: rotate(-30deg);
  transition: transform var(--duration) var(--ease-spring);
}

.task-page__tool--spin svg {
  animation: task-page-spin 600ms var(--ease-out);
}

.task-page__check {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
}

.task-page__result {
  width: 360px;
  max-width: calc(100vw - 48px);
  max-height: 55vh;
  overflow-y: auto;
}

.task-page__next {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-success);
  color: var(--color-on-accent);
  text-decoration: none;
  transition:
    transform var(--duration) var(--ease-spring),
    box-shadow var(--duration) var(--ease-out);
}

.task-page__next:hover {
  box-shadow: 0 6px 18px color-mix(in srgb, var(--color-success) 35%, transparent);
  transform: translateY(-2px);
}

.task-page__next-words {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.task-page__next-label {
  font-size: 12px;
  opacity: 0.85;
}

.task-page__next-name {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-page__next svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--duration) var(--ease-spring);
}

.task-page__next:hover svg {
  transform: translateX(4px);
}

.task-page__to-list {
  align-self: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.task-page__to-list:hover {
  color: var(--color-text);
}

.task-page__next:focus-visible,
.task-page__to-list:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.task-page__check-error {
  max-width: 360px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  background: var(--graph-red-fill);
  box-shadow: var(--shadow-popover);
  font-size: var(--font-size-md);
}

.task-page__check-row {
  position: relative;
}

.task-page__check-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 48px;
  padding: 0 var(--space-5) 0 var(--space-4);
  border: none;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: var(--shadow-accent);
  color: var(--color-on-accent);
  font: inherit;
  font-size: var(--font-size-md);
  font-weight: 700;
  cursor: pointer;
  animation: task-page-rise 420ms var(--ease-spring) 200ms backwards;
  transition:
    background-color var(--duration) var(--ease-out),
    box-shadow var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.task-page__check-button::before {
  content: "";
  position: absolute;
  inset: -4px;
  border: 2px solid var(--color-accent);
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
}

.task-page__check-button:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
}

.task-page__check-button:hover::before {
  animation: task-page-ring 1.1s var(--ease-out) infinite;
}

.task-page__check-button:active {
  transform: scale(0.96);
}

.task-page__check-button--busy {
  cursor: progress;
  background-image: linear-gradient(
    100deg,
    transparent 30%,
    color-mix(in srgb, var(--color-on-accent) 25%, transparent) 50%,
    transparent 70%
  );
  background-size: 250% 100%;
  animation: task-page-sheen 1.1s linear infinite;
}

.task-page__check-button--solved {
  background: var(--color-success);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--color-success) 35%, transparent);
}

.task-page__check-button--solved:hover {
  background: var(--color-success);
}

.task-page__check-button--solved::before {
  border-color: var(--color-success);
}

.task-page__check-button--shake-a {
  animation: task-page-shake-a 420ms var(--ease-out);
}

.task-page__check-button--shake-b {
  animation: task-page-shake-b 420ms var(--ease-out);
}

.task-page__check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.task-page__check-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: task-page-pop 360ms var(--ease-spring);
}

.task-page__check-button:hover .task-page__check-icon svg {
  animation: task-page-wobble 600ms var(--ease-spring);
}

.task-page__check-dots {
  display: flex;
  gap: 4px;
}

.task-page__check-dots span {
  width: 6px;
  height: 6px;
}

.task-page__sparks {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
}

.task-page__spark {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  opacity: 0;
  animation: task-page-spark 900ms var(--ease-out) both;
}

.task-page__spark--0 {
  background: var(--color-success);
}

.task-page__spark--1 {
  background: var(--graph-active);
}

.task-page__spark--2 {
  background: var(--color-accent);
}

.task-page__spark--3 {
  border: 2px solid var(--graph-vertex-stroke);
  background: var(--graph-vertex-fill);
}

.task-page__flash {
  position: absolute;
  inset: 0;
  z-index: 8;
  opacity: 0;
  pointer-events: none;
  animation: task-page-flash 1.3s var(--ease-out) both;
}

.task-page__flash--success {
  box-shadow:
    inset 0 0 0 3px var(--color-success),
    inset 0 0 120px color-mix(in srgb, var(--color-success) 35%, transparent);
  background: radial-gradient(
    circle at 100% 100%,
    color-mix(in srgb, var(--color-success) 18%, transparent),
    transparent 55%
  );
}

.task-page__flash--error {
  box-shadow:
    inset 0 0 0 2px var(--color-danger),
    inset 0 0 90px color-mix(in srgb, var(--color-danger) 28%, transparent);
}

.task-page__scan {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  width: 28%;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-accent) 16%, transparent) 70%,
    color-mix(in srgb, var(--color-accent) 55%, transparent) 98%,
    transparent
  );
  animation: task-page-scan 1.3s ease-in-out infinite;
}

.task-page-card-enter-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform 380ms var(--ease-spring);
}

.task-page-card-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.task-page-card-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.92);
}

.task-page-card-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

@keyframes task-page-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@keyframes task-page-hop {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
}

@keyframes task-page-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

@keyframes task-page-ring {
  from {
    opacity: 0.8;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.18, 1.4);
  }
}

@keyframes task-page-sheen {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -100% 0;
  }
}

@keyframes task-page-shake-a {
  20%,
  60% {
    transform: translateX(-6px) rotate(-2deg);
  }
  40%,
  80% {
    transform: translateX(6px) rotate(2deg);
  }
}

@keyframes task-page-shake-b {
  20%,
  60% {
    transform: translateX(-6px) rotate(-2deg);
  }
  40%,
  80% {
    transform: translateX(6px) rotate(2deg);
  }
}

@keyframes task-page-pop {
  from {
    opacity: 0;
    transform: scale(0.2) rotate(-40deg);
  }
}

@keyframes task-page-wobble {
  30% {
    transform: rotate(-14deg) scale(1.1);
  }
  60% {
    transform: rotate(10deg);
  }
}

@keyframes task-page-spark {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.4);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1);
  }
}

@keyframes task-page-flash {
  15% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes task-page-scan {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  20%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(360%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-page__loader span,
  .task-page__check-dots span,
  .task-page__check-button--busy,
  .task-page__check-button:hover::before,
  .task-page__scan {
    animation: none !important;
  }
}

@media (max-width: 800px) {
  .task-page__body {
    flex-direction: column;
  }

  .task-page__check-button {
    height: 44px;
  }
}
</style>
