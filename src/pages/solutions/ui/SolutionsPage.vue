<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useUserStore } from "@/entities/user";
import { categoryColor } from "@/shared/lib/categoryColor";
import { motionAllowed } from "@/shared/lib/motion";
import { popoverPlace } from "@/shared/lib/popoverPlace";
import { UiButton, UiSegmented, type UiSegmentedOption } from "@/shared/ui";
import { handOffAnswer, loadSolutionGraph, TaskGraphThumb } from "@/widgets/task-view";
import {
  attemptsText,
  emptySolutionsText,
  FILTER_TITLES,
  groupCategories,
  groupMatches,
  groupSolutions,
  groupsFoundText,
  groupSummary,
  loadSolutionsErrorText,
  SOLUTION_FILTERS,
  stuckGroups,
  type SolutionFilter,
  type TaskGroup,
} from "../model/solutionList";
import { recentFeed } from "../model/sideViews";
import { useSolutionList } from "../model/useSolutionList";
import AttemptFeed from "./AttemptFeed.vue";
import AttemptPath from "./AttemptPath.vue";
import AttemptStar from "./AttemptStar.vue";
import SolutionPreviewPopover from "./SolutionPreviewPopover.vue";
import SolutionsBackdrop from "./SolutionsBackdrop.vue";
import SolutionsTips from "./SolutionsTips.vue";
import TaskMap from "./TaskMap.vue";

const STEP = 20;
const SKELETONS = [1, 2, 3, 4];
const PREVIEW_DELAY = 450;
const PREVIEW_WIDTH = 340;
const PREVIEW_HEIGHT = 380;
const FEED_SIZE = 8;
const FLASH_TIME = 1600;
const ART_POINTS = [
  { x: 14, y: 40 },
  { x: 52, y: 14 },
  { x: 90, y: 40 },
  { x: 128, y: 16 },
  { x: 164, y: 36 },
];
const ART_ROUTE = "M14 40 L52 14 L90 40 L128 16 L164 36";

const userStore = useUserStore();
const router = useRouter();
const { solutions, loading, error, cut, load } = useSolutionList();

const filter = ref<SolutionFilter>("all");
const query = ref("");
const category = ref("");
const shownCount = ref(STEP);
const continuing = ref("");
const preview = ref<{ group: TaskGroup; left: number; top: number } | null>(null);
const sentinel = ref<HTMLElement | null>(null);
const categoryList = ref<HTMLElement | null>(null);
const indicator = ref({ top: 0, height: 0, visible: false });
const hoveredKey = ref("");
const flashKey = ref("");
let previewTimer = 0;
let flashTimer = 0;
let observer: IntersectionObserver | null = null;

const lively = computed(() => motionAllowed());

const authorId = computed(() => {
  if (userStore.user === null) {
    return "";
  }
  return userStore.user.id;
});

const needsSignIn = computed(() => !userStore.isLoading && userStore.user === null);

const filterOptions = computed(() => {
  const options: UiSegmentedOption[] = [];
  for (const item of SOLUTION_FILTERS) {
    options.push({ value: item, label: FILTER_TITLES[item] });
  }
  return options;
});

const filterModel = computed({
  get: () => filter.value,
  set: (value: string) => {
    if (value === "all" || value === "solved" || value === "unsolved") {
      filter.value = value;
    }
  },
});

const groups = computed(() => groupSolutions(solutions.value));

const filtered = computed(() => {
  const result: TaskGroup[] = [];
  for (const group of groups.value) {
    if (groupMatches(group, filter.value, query.value, category.value)) {
      result.push(group);
    }
  }
  return result;
});

const visibleGroups = computed(() => filtered.value.slice(0, shownCount.value));
const categories = computed(() => groupCategories(groups.value, 12));
const stuck = computed(() => stuckGroups(groups.value, 4));
const feed = computed(() => recentFeed(solutions.value, FEED_SIZE));

const hoveredCategory = computed(() => {
  for (const group of groups.value) {
    if (group.key === hoveredKey.value) {
      return group.category;
    }
  }
  return "";
});
const searching = computed(() => query.value.trim() !== "" || category.value !== "");
const listKey = computed(() => filter.value + "|" + category.value);

const foundText = computed(() => {
  let attempts = 0;
  for (const group of filtered.value) {
    attempts = attempts + group.attempts.length;
  }
  return groupsFoundText(filtered.value.length) + ", " + attemptsText(attempts);
});

watch(
  authorId,
  (id) => {
    if (id !== "") {
      load(id);
    }
  },
  { immediate: true },
);

watch([filter, query, category], () => {
  shownCount.value = STEP;
  hidePreview();
});

watch([category, categories], () => {
  nextTick(moveIndicator);
});

function moveIndicator() {
  if (categoryList.value === null) {
    return;
  }
  const active = categoryList.value.querySelector<HTMLElement>(".solutions-side__category--active");
  if (active === null) {
    indicator.value = { top: 0, height: 0, visible: false };
    return;
  }
  indicator.value = { top: active.offsetTop, height: active.offsetHeight, visible: true };
}

function pickCategory(name: string) {
  category.value = category.value === name ? "" : name;
}

function catClass(name: string): string {
  return "solutions-cat-" + categoryColor(name);
}

function cardDelay(index: number): string {
  return (index % STEP) * 40 + "ms";
}

function sideDelay(index: number): string {
  return 200 + Math.min(index * 40, 600) + "ms";
}

function showMore() {
  if (shownCount.value < filtered.value.length) {
    shownCount.value = shownCount.value + STEP;
  }
}

function onRetry() {
  if (authorId.value !== "") {
    load(authorId.value);
  }
}

async function continueFrom(group: TaskGroup) {
  if (continuing.value !== "" || group.taskId === null) {
    return;
  }
  continuing.value = group.key;
  const graph = await loadSolutionGraph(group.lastId);
  if (graph !== null) {
    handOffAnswer(group.taskId, graph);
  }
  continuing.value = "";
  router.push({ name: "task", params: { id: group.taskId } });
}

function hidePreview() {
  window.clearTimeout(previewTimer);
  preview.value = null;
}

function onCardLeave() {
  hidePreview();
  hoveredKey.value = "";
}

function cardId(key: string): string {
  return "solution-card-" + key;
}

function indexOfGroup(list: TaskGroup[], key: string): number {
  for (let position = 0; position < list.length; position++) {
    if (list[position].key === key) {
      return position;
    }
  }
  return -1;
}

function flashCard(key: string, tries: number) {
  const card = document.getElementById(cardId(key));
  if (card === null && tries > 0) {
    window.setTimeout(() => flashCard(key, tries - 1), 200);
    return;
  }
  if (card !== null) {
    card.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "center" });
  }
  window.clearTimeout(flashTimer);
  flashKey.value = key;
  flashTimer = window.setTimeout(() => {
    flashKey.value = "";
  }, FLASH_TIME);
}

function pickFromMap(key: string) {
  if (indexOfGroup(filtered.value, key) === -1) {
    filter.value = "all";
    query.value = "";
    category.value = "";
  }
  nextTick(() => {
    const position = indexOfGroup(filtered.value, key);
    if (position >= shownCount.value) {
      shownCount.value = position + STEP;
    }
    nextTick(() => flashCard(key, 3));
  });
}

function onCardEnter(group: TaskGroup, event: PointerEvent) {
  hidePreview();
  hoveredKey.value = group.key;
  if (event.pointerType !== "mouse" || !(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  const card = event.currentTarget;
  previewTimer = window.setTimeout(() => {
    const box = card.getBoundingClientRect();
    const place = popoverPlace(
      box,
      window.innerWidth,
      window.innerHeight,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT,
    );
    if (place !== null) {
      preview.value = { group: group, left: place.left, top: place.top };
    }
  }, PREVIEW_DELAY);
}

function onCardMove(event: PointerEvent) {
  if (!motionAllowed() || !(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spot-x", event.clientX - box.left + "px");
  event.currentTarget.style.setProperty("--spot-y", event.clientY - box.top + "px");
}

function artDelay(index: number): string {
  return 150 + index * 120 + "ms";
}

onMounted(() => {
  window.addEventListener("resize", moveIndicator);
  nextTick(moveIndicator);
  if (typeof IntersectionObserver === "function" && sentinel.value !== null) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          showMore();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel.value);
  }
});

onBeforeUnmount(() => {
  window.clearTimeout(previewTimer);
  window.clearTimeout(flashTimer);
  window.removeEventListener("resize", moveIndicator);
  if (observer !== null) {
    observer.disconnect();
  }
});
</script>

<template>
  <div class="solutions-page">
    <SolutionsBackdrop v-if="lively" />
    <aside class="solutions-side solutions-side--left" aria-label="Категории">
      <section v-if="groups.length > 0" class="solutions-side__card solutions-side__map">
        <p class="solutions-side__title">Карта задач</p>
        <TaskMap
          :groups="groups"
          :active-key="hoveredKey"
          :active-category="category !== '' ? category : hoveredCategory"
          @pick="pickFromMap"
        />
      </section>

      <p class="solutions-side__title">Категории</p>
      <ul ref="categoryList" class="solutions-side__list">
        <span
          class="solutions-side__indicator"
          :class="{ 'solutions-side__indicator--shown': indicator.visible }"
          :style="{ top: indicator.top + 'px', height: indicator.height + 'px' }"
          aria-hidden="true"
        />
        <li class="solutions-side__item" :style="{ animationDelay: sideDelay(0) }">
          <button
            type="button"
            class="solutions-side__category"
            :class="{ 'solutions-side__category--active': category === '' }"
            :aria-pressed="category === ''"
            @click="pickCategory('')"
          >
            <svg class="solutions-side__all" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="4" cy="4" r="2" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Все задачи
          </button>
        </li>
        <li
          v-for="(name, index) in categories"
          :key="name"
          class="solutions-side__item"
          :style="{ animationDelay: sideDelay(index + 1) }"
        >
          <button
            type="button"
            class="solutions-side__category"
            :class="[
              catClass(name),
              {
                'solutions-side__category--active': category === name,
                'solutions-side__category--glow': hoveredCategory === name && category !== name,
              },
            ]"
            :aria-pressed="category === name"
            :title="name"
            @click="pickCategory(name)"
          >
            <span class="solutions-side__dot" aria-hidden="true" />
            <span class="solutions-side__category-text">{{ name }}</span>
          </button>
        </li>
      </ul>

      <section class="solutions-side__card solutions-side__legend">
        <p class="solutions-side__title">Обозначения</p>
        <p class="solutions-side__legend-row">
          <span class="solutions-side__sample solutions-side__sample--ok" />
          верная попытка
        </p>
        <p class="solutions-side__legend-row">
          <span class="solutions-side__sample solutions-side__sample--fail" />
          неверная попытка
        </p>
        <p class="solutions-side__legend-row">
          <span class="solutions-side__sample solutions-side__sample--last" />
          последняя попытка
        </p>
        <p class="solutions-side__note">Кружки идут по порядку: слева старые, справа новые.</p>
      </section>
    </aside>

    <main class="solutions">
      <header class="solutions__header">
        <div class="solutions__heading">
          <h1 class="solutions__title">Мои решения</h1>
          <p class="solutions__lead">
            Все попытки по задачам: что уже получилось и к чему стоит вернуться.
          </p>
        </div>
        <svg class="solutions__art" viewBox="0 0 178 54" aria-hidden="true">
          <path class="solutions__art-route" :d="ART_ROUTE" pathLength="1" />
          <circle
            v-for="(point, index) in ART_POINTS"
            :key="index"
            class="solutions__art-dot"
            :class="{ 'solutions__art-dot--ok': index === ART_POINTS.length - 1 }"
            :cx="point.x"
            :cy="point.y"
            r="7"
            :style="{ animationDelay: artDelay(index) }"
          />
          <circle v-if="lively" class="solutions__art-token" r="3.5">
            <animateMotion
              :path="ART_ROUTE"
              dur="3s"
              begin="0.8s"
              repeatCount="indefinite"
              keyPoints="0;1;1"
              keyTimes="0;0.7;1"
              calcMode="linear"
            />
          </circle>
        </svg>
      </header>

      <p v-if="needsSignIn" class="solutions__message">
        Решения видны только после входа.
        <RouterLink :to="{ name: 'sign-in', query: { redirect: '/solutions' } }">Войти</RouterLink>
      </p>

      <template v-else>
        <div class="solutions__toolbar">
          <label class="solutions__search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16 L20.5 20.5" />
            </svg>
            <input
              v-model="query"
              type="search"
              class="solutions__input"
              placeholder="Найти задачу"
              aria-label="Название задачи"
              autocomplete="off"
            />
            <Transition name="solutions-pop">
              <button
                v-if="query !== ''"
                type="button"
                class="solutions__clear"
                aria-label="Очистить поиск"
                @click="query = ''"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4 L12 12 M12 4 L4 12" />
                </svg>
              </button>
            </Transition>
          </label>
          <UiSegmented
            v-model="filterModel"
            :options="filterOptions"
            label="Какие задачи показать"
          />
        </div>

        <p v-if="groups.length > 0 && error === null" class="solutions__count">
          {{ foundText }}
        </p>

        <Transition name="solutions-swap" mode="out-in">
          <div
            v-if="error !== null"
            key="error"
            class="solutions__message solutions__message--error"
            role="alert"
          >
            <span>{{ loadSolutionsErrorText(error) }}</span>
            <UiButton size="sm" @click="onRetry">Повторить</UiButton>
          </div>

          <ul
            v-else-if="loading && groups.length === 0"
            key="skeleton"
            class="solutions__list"
            aria-label="Загружаю решения"
          >
            <li
              v-for="(item, index) in SKELETONS"
              :key="item"
              class="solutions__skeleton"
              :style="{ animationDelay: cardDelay(index) }"
            >
              <span class="solutions__skeleton-line solutions__skeleton-line--short" />
              <span class="solutions__skeleton-line solutions__skeleton-line--title" />
              <span class="solutions__skeleton-dots">
                <span v-for="dot in 5" :key="dot" />
              </span>
            </li>
          </ul>

          <div
            v-else-if="filtered.length === 0 && authorId !== ''"
            key="empty"
            class="solutions__empty"
          >
            <svg class="solutions__empty-art" viewBox="0 0 140 70" aria-hidden="true">
              <path d="M16 46 L52 22 L88 46" />
              <path class="solutions__empty-gap" d="M88 46 L124 22" />
              <circle cx="16" cy="46" r="8" />
              <circle cx="52" cy="22" r="8" />
              <circle cx="88" cy="46" r="8" />
              <circle class="solutions__empty-goal" cx="124" cy="22" r="8" />
            </svg>
            <p class="solutions__empty-text">{{ emptySolutionsText(filter, searching) }}</p>
            <RouterLink class="solutions__empty-link" :to="{ name: 'tasks' }">
              К задачам
            </RouterLink>
          </div>

          <ul v-else :key="listKey" class="solutions__list">
            <li
              v-for="(group, index) in visibleGroups"
              :key="group.key"
              class="solutions__item"
              :style="{ animationDelay: cardDelay(index) }"
            >
              <article
                :id="cardId(group.key)"
                class="solutions__card"
                :class="[
                  catClass(group.category),
                  group.solved ? 'solutions__card--solved' : 'solutions__card--open',
                  { 'solutions__card--flash': flashKey === group.key },
                ]"
                @pointerenter="onCardEnter(group, $event)"
                @pointerleave="onCardLeave"
                @pointermove="onCardMove"
              >
                <div class="solutions__card-main">
                  <div class="solutions__card-top">
                    <span
                      class="solutions__state"
                      :class="group.solved ? 'solutions__state--ok' : 'solutions__state--open'"
                    >
                      <svg v-if="group.solved" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                      </svg>
                      <svg v-else viewBox="0 0 16 16" aria-hidden="true">
                        <circle cx="8" cy="8" r="3" />
                      </svg>
                      {{ group.solved ? "Решена" : "Не решена" }}
                    </span>
                    <span v-if="group.category !== ''" class="solutions__category">
                      {{ group.category }}
                    </span>
                  </div>
                  <RouterLink
                    class="solutions__name"
                    :to="{ name: 'solution', params: { id: group.lastId } }"
                  >
                    {{ group.taskName }}
                  </RouterLink>
                  <p class="solutions__summary">
                    {{ groupSummary(group) }} · {{ attemptsText(group.attempts.length) }}
                  </p>
                  <AttemptPath :attempts="group.attempts" />
                  <div class="solutions__actions">
                    <RouterLink
                      class="solutions__action solutions__action--main"
                      :to="{ name: 'solution', params: { id: group.lastId } }"
                    >
                      Последняя попытка
                    </RouterLink>
                    <RouterLink
                      v-if="group.taskId !== null"
                      class="solutions__action"
                      :to="{ name: 'task', params: { id: group.taskId } }"
                    >
                      Решить заново
                    </RouterLink>
                    <button
                      v-if="group.taskId !== null && group.isGraph"
                      type="button"
                      class="solutions__action"
                      :class="{ 'solutions__action--busy': continuing === group.key }"
                      :disabled="continuing !== ''"
                      @click="continueFrom(group)"
                    >
                      Продолжить с последнего графа
                    </button>
                  </div>
                </div>
                <TaskGraphThumb
                  v-if="group.taskId !== null"
                  class="solutions__thumb"
                  :task-id="group.taskId"
                />
              </article>
            </li>
          </ul>
        </Transition>

        <UiButton
          v-if="filtered.length > shownCount && error === null"
          class="solutions__more"
          @click="showMore"
        >
          Показать ещё
        </UiButton>
        <p v-if="cut" class="solutions__note">
          Показаны первые 1000 решений — более старые здесь не видны.
        </p>
      </template>
      <div ref="sentinel" class="solutions__sentinel" aria-hidden="true" />

      <SolutionPreviewPopover
        v-if="preview !== null"
        :key="preview.group.key"
        :group="preview.group"
        :left="preview.left"
        :top="preview.top"
        :color-class="catClass(preview.group.category)"
      />
    </main>

    <aside class="solutions-side solutions-side--right" aria-label="Ещё">
      <section class="solutions-side__card solutions-side__card--stuck">
        <p class="solutions-side__title">Стоит вернуться</p>
        <p v-if="stuck.length === 0 && groups.length > 0" class="solutions-side__note">
          Все начатые задачи решены.
        </p>
        <p v-else-if="stuck.length === 0" class="solutions-side__note">
          Здесь появятся задачи, которые пока не получились.
        </p>
        <ul v-else class="solutions-side__stuck">
          <li
            v-for="(group, index) in stuck"
            :key="group.key"
            class="solutions-side__item"
            :style="{ animationDelay: sideDelay(index) }"
          >
            <RouterLink
              v-if="group.taskId !== null"
              class="solutions-side__stuck-link"
              :to="{ name: 'task', params: { id: group.taskId } }"
              :title="group.taskName"
            >
              <AttemptStar :attempts="group.attempts.slice(-10)" />
              <span class="solutions-side__stuck-words">
                <span class="solutions-side__stuck-name">{{ group.taskName }}</span>
                <span class="solutions-side__stuck-meta">
                  {{ attemptsText(group.attempts.length) }}, пока без верной
                </span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section v-if="feed.length > 0" class="solutions-side__card">
        <p class="solutions-side__title">Лента попыток</p>
        <AttemptFeed :items="feed" />
      </section>

      <section class="solutions-side__card">
        <SolutionsTips />
      </section>
    </aside>
  </div>
</template>

<style scoped>
.solutions-page {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.solutions-side {
  display: none;
}

.solutions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.solutions__header {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
}

.solutions__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  animation: solutions-rise 420ms var(--ease-out) backwards;
}

.solutions__title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}

.solutions__lead {
  margin: 0;
  color: var(--color-text-muted);
}

.solutions__art {
  flex-shrink: 0;
  width: 178px;
  height: 54px;
  margin-left: auto;
  overflow: visible;
}

.solutions__art-route {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  animation: solutions-draw 900ms var(--ease-out) 100ms backwards;
}

.solutions__art-dot {
  fill: var(--graph-red-fill);
  stroke: var(--color-danger);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: solutions-node 460ms var(--ease-spring) backwards;
}

.solutions__art-dot--ok {
  fill: var(--graph-green-fill);
  stroke: var(--color-success);
  animation:
    solutions-node 460ms var(--ease-spring) backwards,
    solutions-goal 3s ease-out 1.4s infinite;
}

.solutions__art-token {
  fill: var(--graph-active);
  filter: drop-shadow(0 0 4px var(--graph-active));
}

.solutions__toolbar {
  position: sticky;
  top: var(--space-2);
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: 4px 4px 4px var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: solutions-rise 420ms var(--ease-out) 80ms backwards;
  transition:
    border-color var(--duration) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
}

.solutions__toolbar:focus-within {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-accent);
}

.solutions__search {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  min-width: 200px;
}

.solutions__search > svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 2;
  stroke-linecap: round;
  transition:
    stroke var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.solutions__search:focus-within > svg {
  stroke: var(--color-accent);
  transform: scale(1.12) rotate(-8deg);
}

.solutions__input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-lg);
}

.solutions__input::-webkit-search-cancel-button {
  display: none;
}

.solutions__clear {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-surface-hover);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: transform var(--duration) var(--ease-spring);
}

.solutions__clear:hover {
  color: var(--color-text);
  transform: rotate(90deg);
}

.solutions__clear svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.solutions__count {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.solutions__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}

.solutions__message--error {
  border: 1px solid var(--color-danger);
  background: var(--graph-red-fill);
  color: var(--color-text);
  animation: solutions-shake 420ms var(--ease-out);
}

.solutions__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.solutions__item {
  animation: solutions-card-in 460ms var(--ease-out) backwards;
}

.solutions__card {
  --cat: var(--color-accent);

  position: relative;
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-4) var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring),
    box-shadow var(--duration) var(--ease-out);
}

.solutions__card::before {
  content: "";
  position: absolute;
  top: var(--space-3);
  bottom: var(--space-3);
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--cat);
  transform: scaleY(0.35);
  opacity: 0.6;
  transition:
    transform var(--duration) var(--ease-spring),
    opacity var(--duration) var(--ease-out);
}

.solutions__card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    280px circle at var(--spot-x, 50%) var(--spot-y, 50%),
    color-mix(in srgb, var(--cat) 10%, transparent),
    transparent 70%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration) var(--ease-out);
}

.solutions__card:hover {
  border-color: var(--cat);
  box-shadow: var(--shadow-popover);
  transform: translateY(-3px);
}

.solutions__card:hover::before {
  transform: scaleY(1);
  opacity: 1;
}

.solutions__card:hover::after {
  opacity: 1;
}

.solutions__card-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.solutions__card-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.solutions__state {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px var(--space-2) 2px 4px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.solutions__state svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.solutions__state--ok {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.solutions__state--open {
  background: color-mix(in srgb, var(--graph-active) 18%, transparent);
  color: var(--graph-active);
}

.solutions__state--open svg {
  fill: currentColor;
  animation: solutions-breathe 2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.solutions__category {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--cat) 16%, transparent);
  color: var(--cat);
  font-size: 12px;
  font-weight: 600;
}

.solutions__name {
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: 700;
  line-height: 1.35;
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.solutions__name:hover {
  color: var(--cat);
}

.solutions__summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.solutions__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.solutions__action {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-sm);
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.solutions__action:hover:not(:disabled) {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.solutions__action:disabled {
  cursor: default;
  opacity: 0.6;
}

.solutions__action--main {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.solutions__action--busy {
  background-image: linear-gradient(
    100deg,
    transparent 30%,
    color-mix(in srgb, var(--color-accent) 25%, transparent) 50%,
    transparent 70%
  );
  background-size: 250% 100%;
  animation: solutions-sheen 1.1s linear infinite;
}

.solutions__name:focus-visible,
.solutions__action:focus-visible,
.solutions__clear:focus-visible,
.solutions__empty-link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.solutions__thumb {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  align-self: center;
}

.solutions__card:hover :deep(.graph-mini__line) {
  stroke: var(--cat);
  animation: solutions-draw 700ms var(--ease-out) calc(var(--mini-index) * 40ms) backwards;
}

.solutions__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  animation: solutions-rise 360ms var(--ease-out) backwards;
}

.solutions__skeleton-line,
.solutions__skeleton-dots span {
  background: linear-gradient(
    90deg,
    var(--color-surface-hover) 25%,
    var(--color-border) 50%,
    var(--color-surface-hover) 75%
  );
  background-size: 200% 100%;
  animation: solutions-shimmer 1.2s linear infinite;
}

.solutions__skeleton-line {
  height: 12px;
  border-radius: 6px;
}

.solutions__skeleton-line--short {
  width: 110px;
}

.solutions__skeleton-line--title {
  width: 50%;
  height: 18px;
}

.solutions__skeleton-dots {
  display: flex;
  gap: 14px;
}

.solutions__skeleton-dots span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.solutions__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  animation: solutions-empty-in 420ms var(--ease-spring) backwards;
}

.solutions__empty-art {
  width: 140px;
  height: 70px;
  overflow: visible;
  fill: var(--color-surface);
  stroke: var(--color-text-muted);
  stroke-width: 2;
}

.solutions__empty-art path {
  fill: none;
}

.solutions__empty-gap {
  stroke: var(--graph-active);
  stroke-dasharray: 4 4;
  animation: solutions-march 900ms linear infinite;
}

.solutions__empty-goal {
  stroke: var(--color-success);
  stroke-dasharray: 4 3;
  transform-box: fill-box;
  transform-origin: center;
  animation: solutions-breathe 2.4s ease-in-out infinite;
}

.solutions__empty-text {
  margin: 0;
  color: var(--color-text-muted);
}

.solutions__empty-link {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
  text-decoration: none;
  transition: transform var(--duration) var(--ease-spring);
}

.solutions__empty-link:hover {
  transform: translateY(-2px);
}

.solutions__more {
  align-self: center;
}

.solutions__note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.solutions__sentinel {
  height: 1px;
}

.solutions-cat-0 {
  --cat: var(--color-accent);
}

.solutions-cat-1 {
  --cat: var(--graph-active);
}

.solutions-cat-2 {
  --cat: var(--color-success);
}

.solutions-cat-3 {
  --cat: var(--color-danger);
}

.solutions-cat-4 {
  --cat: color-mix(in oklch, var(--color-accent), var(--color-danger));
}

.solutions-cat-5 {
  --cat: color-mix(in oklch, var(--graph-active), var(--color-success));
}

.solutions-side__title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.solutions-side__list,
.solutions-side__stuck {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.solutions-side__indicator {
  position: absolute;
  right: 0;
  left: 0;
  border-radius: var(--radius-md);
  background: var(--color-accent-muted);
  opacity: 0;
  transition:
    top 380ms var(--ease-spring),
    height 380ms var(--ease-spring),
    opacity var(--duration) var(--ease-out);
}

.solutions-side__indicator::before {
  content: "";
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
}

.solutions-side__indicator--shown {
  opacity: 1;
}

.solutions-side__item {
  position: relative;
  animation: solutions-side-in 380ms var(--ease-out) backwards;
}

.solutions-side--right .solutions-side__item {
  animation-name: solutions-side-in-right;
}

.solutions-side__category {
  --cat: var(--color-text-muted);

  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 34px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    padding-left var(--duration) var(--ease-spring);
}

.solutions-side__category:hover {
  padding-left: calc(var(--space-3) + 4px);
  color: var(--color-text);
}

.solutions-side__category--active {
  color: var(--color-text);
  font-weight: 600;
}

.solutions-side__category:focus-visible,
.solutions-side__stuck-link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.solutions-side__category-text,
.solutions-side__stuck-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.solutions-side__all {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  fill: var(--color-accent);
}

.solutions-side__dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border: 2px solid var(--cat);
  border-radius: 50%;
  transition:
    background-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.solutions-side__category:hover .solutions-side__dot,
.solutions-side__category--active .solutions-side__dot {
  background: var(--cat);
  transform: scale(1.25);
}

.solutions-side__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(
      120% 80% at 100% 0%,
      color-mix(in srgb, var(--color-accent) 9%, transparent),
      transparent 60%
    ),
    var(--color-surface);
  animation: solutions-side-in-right 420ms var(--ease-out) backwards;
  transition:
    border-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring),
    box-shadow var(--duration) var(--ease-out);
}

.solutions-side__card:hover {
  border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

.solutions-side__card + .solutions-side__card {
  animation-delay: 140ms;
}

.solutions-side__card + .solutions-side__card + .solutions-side__card {
  animation-delay: 280ms;
}

.solutions-side__card--stuck {
  border-color: transparent;
  background:
    linear-gradient(var(--color-surface), var(--color-surface)) padding-box,
    conic-gradient(
        from var(--stuck-angle),
        var(--graph-active),
        var(--color-danger),
        var(--color-accent),
        var(--graph-active)
      )
      border-box;
  animation:
    solutions-side-in-right 420ms var(--ease-out) backwards,
    solutions-turn 7s linear infinite;
}

.solutions-side__card--stuck:hover {
  border-color: transparent;
}

.solutions-side__map {
  margin-bottom: var(--space-3);
  animation-name: solutions-side-in;
}

.solutions-side__category--glow {
  color: var(--color-text);
}

.solutions-side__category--glow .solutions-side__dot {
  background: var(--cat);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cat) 30%, transparent);
  transform: scale(1.3);
}

.solutions__card--flash {
  animation: solutions-flash-card 1.5s var(--ease-out);
}

.solutions-side__legend {
  margin-top: var(--space-3);
  animation-name: solutions-side-in;
}

.solutions-side__legend-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
}

.solutions-side__sample {
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.solutions-side__sample--ok {
  background: var(--color-success);
}

.solutions-side__sample--fail {
  background: var(--color-danger);
}

.solutions-side__sample--last {
  border: 2px solid var(--color-accent);
  animation: solutions-ring 2s var(--ease-out) infinite;
}

.solutions-side__note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.solutions-side__stuck {
  gap: var(--space-1);
}

.solutions-side__stuck-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.solutions-side__stuck-link:hover {
  background: var(--color-surface-hover);
  transform: translateX(3px);
}

.solutions-side__stuck-words {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.solutions-side__stuck-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: 12px;
}

.solutions-swap-enter-active {
  transition: opacity var(--duration) var(--ease-out);
}

.solutions-swap-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.solutions-swap-enter-from {
  opacity: 0;
}

.solutions-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.solutions-pop-enter-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform 320ms var(--ease-spring);
}

.solutions-pop-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.solutions-pop-enter-from,
.solutions-pop-leave-to {
  opacity: 0;
  transform: scale(0.4);
}

@property --stuck-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes solutions-turn {
  to {
    --stuck-angle: 360deg;
  }
}

@keyframes solutions-flash-card {
  0%,
  100% {
    box-shadow: none;
  }
  20%,
  60% {
    border-color: var(--cat);
    box-shadow:
      0 0 0 4px color-mix(in srgb, var(--cat) 35%, transparent),
      var(--shadow-popover);
  }
}

@keyframes solutions-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes solutions-card-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
}

@keyframes solutions-side-in {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
}

@keyframes solutions-side-in-right {
  from {
    opacity: 0;
    transform: translateX(14px);
  }
}

@keyframes solutions-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes solutions-node {
  from {
    opacity: 0;
    transform: scale(0);
  }
}

@keyframes solutions-goal {
  0%,
  60%,
  100% {
    transform: scale(1);
    filter: none;
  }
  70% {
    transform: scale(1.35);
    filter: drop-shadow(0 0 6px var(--color-success));
  }
}

@keyframes solutions-breathe {
  50% {
    transform: scale(1.25);
  }
}

@keyframes solutions-ring {
  50% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 30%, transparent);
  }
}

@keyframes solutions-shimmer {
  to {
    background-position: -200% 0;
  }
}

@keyframes solutions-march {
  to {
    stroke-dashoffset: -16;
  }
}

@keyframes solutions-sheen {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -100% 0;
  }
}

@keyframes solutions-shake {
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

@keyframes solutions-empty-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
}

@media (prefers-reduced-motion: reduce) {
  .solutions__art-dot--ok,
  .solutions__state--open svg,
  .solutions__empty-gap,
  .solutions__empty-goal,
  .solutions-side__sample--last,
  .solutions-side__card--stuck {
    animation: none !important;
  }
}

@media (min-width: 1280px) {
  .solutions-page {
    grid-template-columns: 210px minmax(0, 880px) 250px;
    justify-content: center;
    column-gap: var(--space-6);
    padding: 0 var(--space-4);
  }

  .solutions-side {
    position: sticky;
    top: var(--space-4);
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-self: start;
    margin-top: calc(var(--space-6) + 110px);
  }

  .solutions {
    padding-right: 0;
    padding-left: 0;
  }
}

@media (max-width: 640px) {
  .solutions__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .solutions__art,
  .solutions__thumb {
    display: none;
  }
}
</style>
