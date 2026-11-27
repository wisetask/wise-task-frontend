<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/entities/user";
import { canExpand, expandGhost } from "@/shared/lib/expandGhost";
import { motionAllowed } from "@/shared/lib/motion";
import { forgetRecentTasks, readRecentTasks, type RecentTask } from "@/shared/lib/recentTasks";
import { UiButton } from "@/shared/ui";
import { TaskGraphThumb } from "@/widgets/task-view";
import {
  BASE_PLACEHOLDER,
  chainLinks,
  codeMatches,
  countStep,
  GRAPH_CODE,
  placeholderExamples,
  placeholderFrame,
  popoverPlace,
  pushCode,
  tiltAngles,
  wantsKonigsberg,
} from "../model/searchMotion";
import {
  emptyFilter,
  emptyListText,
  filterFromQuery,
  foundText,
  highlightParts,
  isFilterEmpty,
  loadErrorText,
  plural,
  popularCategories,
  queryFromFilter,
  type TaskFilter,
  type TaskListItem,
} from "../model/taskList";
import { categoryColor, markTitle, type TaskMark } from "../model/taskMarks";
import { useTaskList } from "../model/useTaskList";
import { useTaskMarks } from "../model/useTaskMarks";
import GraphFactCard from "./GraphFactCard.vue";
import KonigsbergScene from "./KonigsbergScene.vue";
import TaskPreviewPopover from "./TaskPreviewPopover.vue";
import TasksConstellation from "./TasksConstellation.vue";

const SEARCH_DELAY = 350;
const SKELETONS = [1, 2, 3, 4, 5];
const COUNT_DURATION = 600;
const TYPE_STEP = 70;
const STUCK_AFTER = 60;
const TOP_BUTTON_AFTER = 900;
const ROLL_TIME = 750;
const PREVIEW_DELAY = 450;
const PREVIEW_WIDTH = 340;
const PREVIEW_HEIGHT = 420;
const LINK_TIME = 2400;
const LINK_LIMIT = 24;
const ART_NODES = [
  { x: 14, y: 40 },
  { x: 48, y: 14 },
  { x: 82, y: 38 },
  { x: 116, y: 14 },
  { x: 148, y: 36 },
];
const ART_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 3],
];
const ART_ROUTE = "M14 40 L48 14 L82 38 L116 14 L148 36 L116 14 L82 38 L48 14 Z";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { tasks, totalCount, hasNext, loading, error, generation, search, loadMore, pickRandom } =
  useTaskList();

const filter = ref<TaskFilter>(filterFromQuery(route.query));
const appliedFilter = ref<TaskFilter>(emptyFilter());
const seenTasks = ref<TaskListItem[]>([]);
const sentinel = ref<HTMLElement | null>(null);
const page = ref<HTMLElement | null>(null);
const searching = ref(false);
const shownCount = ref<number | null>(null);
const placeholder = ref(BASE_PLACEHOLDER);
const nameFocused = ref(false);
const stuck = ref(false);
const showTop = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);
const recent = ref<RecentTask[]>(readRecentTasks());
const { marks, load: loadMarks } = useTaskMarks();
const preview = ref<{ task: TaskListItem; left: number; top: number } | null>(null);
let previewTimer = 0;
const rolling = ref(false);
const luckFailed = ref(false);
const impatience = ref(0);
const list = ref<HTMLElement | null>(null);
const linkScene = ref<LinkScene | null>(null);
let codeBuffer: string[] = [];
let linkTimer = 0;

interface LinkScene {
  key: number;
  width: number;
  height: number;
  points: { x: number; y: number }[];
  links: number[][];
}
const lively = computed(() => motionAllowed());
let searchTimer = 0;
let typeTimer = 0;
let typeStep = BASE_PLACEHOLDER.length - 1;
let countFrame = 0;
let phrases: string[] = [BASE_PLACEHOLDER];
let observer: IntersectionObserver | null = null;
let scroller: HTMLElement | null = null;

const canCreate = computed(() => {
  const user = userStore.user;
  return user !== null && (user.role === "AUTHOR" || user.role === "ADMIN");
});

const countText = computed(() => {
  if (shownCount.value === null) {
    return "";
  }
  return foundText(shownCount.value);
});

const shownText = computed(() => {
  if (totalCount.value === null || tasks.value.length >= totalCount.value) {
    return "";
  }
  return "показано " + tasks.value.length;
});

const categories = computed(() => popularCategories(seenTasks.value, 8));
const activeCategory = computed(() => filter.value.category.trim());
const showKonigsberg = computed(() =>
  wantsKonigsberg(appliedFilter.value.name, searching.value ? null : totalCount.value),
);
const sideCategories = computed(() => popularCategories(seenTasks.value, 14));

const luckText = computed(() => {
  if (rolling.value && impatience.value > 0) {
    return "Не торопите кубик 🎲";
  }
  if (luckFailed.value) {
    return "Не вышло, попробуйте ещё";
  }
  if (totalCount.value === null) {
    return "Из найденных задач";
  }
  return "Из " + totalCount.value + " " + plural(totalCount.value, "задачи", "задач", "задач");
});

function sameFilter(first: TaskFilter, second: TaskFilter): boolean {
  return (
    first.name.trim() === second.name.trim() && first.category.trim() === second.category.trim()
  );
}

function runSearch() {
  window.clearTimeout(searchTimer);
  appliedFilter.value = { name: filter.value.name, category: filter.value.category };
  router.replace({ query: queryFromFilter(filter.value) });
  searching.value = true;
  search(appliedFilter.value);
}

function scheduleSearch() {
  window.clearTimeout(searchTimer);
  if (sameFilter(filter.value, appliedFilter.value)) {
    return;
  }
  searchTimer = window.setTimeout(runSearch, SEARCH_DELAY);
}

watch([() => filter.value.name, () => filter.value.category], scheduleSearch);

watch(loading, (value) => {
  if (!value) {
    searching.value = false;
  }
});

watch(tasks, (list) => {
  const known: Record<string, boolean> = {};
  for (const task of seenTasks.value) {
    known[task.id] = true;
  }
  const added: TaskListItem[] = [];
  for (const task of list) {
    if (!known[task.id]) {
      added.push(task);
    }
  }
  if (added.length > 0) {
    seenTasks.value = seenTasks.value.concat(added).slice(-300);
  }
  if (phrases.length < 2) {
    phrases = [BASE_PLACEHOLDER].concat(placeholderExamples(seenTasks.value, 4));
  }
});

watch(
  () => (userStore.user === null ? "" : userStore.user.id),
  (id) => {
    loadMarks(id);
  },
  { immediate: true },
);

watch(totalCount, (next, previous) => {
  animateCount(previous, next);
});

function animateCount(from: number | null, to: number | null) {
  window.cancelAnimationFrame(countFrame);
  if (to === null || !motionAllowed()) {
    shownCount.value = to;
    return;
  }
  let begin = 0;
  if (from !== null) {
    begin = from;
  }
  const end = to;
  const start = performance.now();
  function frame(now: number) {
    const progress = (now - start) / COUNT_DURATION;
    shownCount.value = countStep(begin, end, progress);
    if (progress < 1) {
      countFrame = window.requestAnimationFrame(frame);
    }
  }
  countFrame = window.requestAnimationFrame(frame);
}

function typeNext() {
  if (nameFocused.value || phrases.length < 2 || !motionAllowed()) {
    placeholder.value = BASE_PLACEHOLDER;
    typeStep = BASE_PLACEHOLDER.length - 1;
  } else if (filter.value.name === "") {
    typeStep = typeStep + 1;
    placeholder.value = placeholderFrame(phrases, typeStep);
  }
  typeTimer = window.setTimeout(typeNext, TYPE_STEP);
}

function clearName() {
  filter.value.name = "";
  runSearch();
}

function clearCategory() {
  filter.value.category = "";
  runSearch();
}

function pickCategory(category: string) {
  filter.value.category = activeCategory.value === category ? "" : category;
  runSearch();
}

function resetFilter() {
  filter.value = emptyFilter();
  runSearch();
}

function onLoadMore() {
  if (!hasNext.value || loading.value || error.value !== null) {
    return;
  }
  loadMore(appliedFilter.value);
}

function initials(author: string): string {
  const words = author.split(" ").filter((word) => word !== "");
  let result = "";
  for (const word of words.slice(0, 2)) {
    result = result + word[0].toUpperCase();
  }
  return result;
}

function cardDelay(index: number): string {
  return (index % 20) * 30 + "ms";
}

function chipDelay(index: number): string {
  return index * 35 + "ms";
}

function nodeDelay(index: number): string {
  return 120 + index * 90 + "ms";
}

function edgeDelay(index: number): string {
  return 260 + index * 110 + "ms";
}

function edgePath(edge: number[]): string {
  const from = ART_NODES[edge[0]];
  const to = ART_NODES[edge[1]];
  return "M" + from.x + " " + from.y + " L" + to.x + " " + to.y;
}

function catClass(category: string): string {
  return "tasks-cat-" + categoryColor(category);
}

function markOf(taskId: string): TaskMark | undefined {
  return marks.value[taskId];
}

function hidePreview() {
  window.clearTimeout(previewTimer);
  preview.value = null;
}

function onCardEnter(task: TaskListItem, event: PointerEvent) {
  hidePreview();
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
      preview.value = { task: task, left: place.left, top: place.top };
    }
  }, PREVIEW_DELAY);
}

function sideDelay(index: number): string {
  return 200 + Math.min(index * 40, 600) + "ms";
}

function wait(time: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, time);
  });
}

async function onLucky(event: MouseEvent) {
  const button = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (rolling.value) {
    impatience.value = impatience.value + 1;
    return;
  }
  impatience.value = 0;
  rolling.value = true;
  luckFailed.value = false;
  const started = performance.now();
  let task = await pickRandom(appliedFilter.value);
  if (task === null && tasks.value.length > 0) {
    task = tasks.value[Math.floor(Math.random() * tasks.value.length)];
  }
  const waited = performance.now() - started;
  if (motionAllowed() && waited < ROLL_TIME) {
    await wait(ROLL_TIME - waited);
  }
  rolling.value = false;
  if (task === null) {
    luckFailed.value = true;
    return;
  }
  if (button !== null) {
    expandGhost(button, scroller, task.name);
  }
  router.push({ name: "task", params: { id: task.id } });
}

function clearRecent() {
  forgetRecentTasks();
  recent.value = [];
}

function isTyping(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }
  return target instanceof HTMLElement && target.isContentEditable;
}

function linkCards() {
  if (list.value === null || page.value === null) {
    return;
  }
  const area = page.value.getBoundingClientRect();
  const items = list.value.querySelectorAll(".tasks__item");
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < items.length && index < LINK_LIMIT; index++) {
    const box = items[index].getBoundingClientRect();
    const x = index % 2 === 0 ? box.left + 26 : box.right - 26;
    points.push({
      x: Math.round(x - area.left),
      y: Math.round(box.top + box.height / 2 - area.top),
    });
  }
  if (points.length < 2) {
    return;
  }
  window.clearTimeout(linkTimer);
  linkScene.value = {
    key: Date.now(),
    width: Math.round(area.width),
    height: Math.round(page.value.scrollHeight),
    points: points,
    links: chainLinks(points.length),
  };
  linkTimer = window.setTimeout(() => {
    linkScene.value = null;
  }, LINK_TIME);
}

function linkLine(link: number[]): Record<string, number> {
  if (linkScene.value === null) {
    return {};
  }
  const from = linkScene.value.points[link[0]];
  const to = linkScene.value.points[link[1]];
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
}

function linkDelay(index: number): string {
  return index * 70 + "ms";
}

function onKeydown(event: KeyboardEvent) {
  const input = nameInput.value;
  if (input === null) {
    return;
  }
  if (!isTyping(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) {
    codeBuffer = pushCode(codeBuffer, event.code, GRAPH_CODE);
    if (codeMatches(codeBuffer, GRAPH_CODE)) {
      codeBuffer = [];
      linkCards();
    }
  }
  if (event.key === "/" && !isTyping(event.target) && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    input.focus();
    return;
  }
  if (event.key === "Escape" && event.target === input) {
    if (filter.value.name !== "") {
      clearName();
    } else {
      input.blur();
    }
  }
}

function onCardMove(event: PointerEvent) {
  if (!motionAllowed() || !(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  const tilt = tiltAngles(x, y, box.width, box.height);
  card.style.setProperty("--spot-x", x + "px");
  card.style.setProperty("--spot-y", y + "px");
  card.style.setProperty("--tilt-x", tilt.x + "deg");
  card.style.setProperty("--tilt-y", tilt.y + "deg");
}

function onCardClick(task: TaskListItem, event: MouseEvent) {
  hidePreview();
  if (!canExpand(event) || !(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  expandGhost(event.currentTarget, scroller, task.name);
}

function onRecentClick(task: RecentTask, event: MouseEvent) {
  if (!canExpand(event) || !(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  expandGhost(event.currentTarget, scroller, task.name);
}

function onCardLeave(event: PointerEvent) {
  hidePreview();
  if (!(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
}

function findScroller(element: HTMLElement | null): HTMLElement | null {
  let current = element === null ? null : element.parentElement;
  while (current !== null) {
    const overflow = window.getComputedStyle(current).overflowY;
    if (overflow === "auto" || overflow === "scroll") {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function scrolledBy(): number {
  if (scroller !== null) {
    return scroller.scrollTop;
  }
  return window.scrollY;
}

function onScroll() {
  hidePreview();
  const offset = scrolledBy();
  stuck.value = offset > STUCK_AFTER;
  showTop.value = offset > TOP_BUTTON_AFTER;
}

function scrollToTop() {
  const behavior = motionAllowed() ? "smooth" : "auto";
  if (scroller !== null) {
    scroller.scrollTo({ top: 0, behavior: behavior });
  } else {
    window.scrollTo({ top: 0, behavior: behavior });
  }
}

onMounted(() => {
  runSearch();
  typeTimer = window.setTimeout(typeNext, TYPE_STEP);
  window.addEventListener("keydown", onKeydown);
  scroller = findScroller(page.value);
  if (scroller !== null) {
    scroller.addEventListener("scroll", onScroll, { passive: true });
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  if (typeof IntersectionObserver === "function" && sentinel.value !== null) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel.value);
  }
});

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer);
  window.clearTimeout(typeTimer);
  window.cancelAnimationFrame(countFrame);
  window.clearTimeout(linkTimer);
  window.clearTimeout(previewTimer);
  window.removeEventListener("keydown", onKeydown);
  if (scroller !== null) {
    scroller.removeEventListener("scroll", onScroll);
  } else {
    window.removeEventListener("scroll", onScroll);
  }
  if (observer !== null) {
    observer.disconnect();
  }
});
</script>

<template>
  <div class="tasks-page">
    <aside class="tasks-side tasks-side--left" aria-label="Категории">
      <p class="tasks-side__title">Категории</p>
      <ul class="tasks-side__list">
        <li class="tasks-side__item" :style="{ animationDelay: sideDelay(0) }">
          <button
            type="button"
            class="tasks-side__category"
            :class="{ 'tasks-side__category--active': activeCategory === '' }"
            :aria-pressed="activeCategory === ''"
            @click="pickCategory('')"
          >
            <svg class="tasks-side__all" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="4" cy="4" r="2" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Все задачи
          </button>
        </li>
        <li
          v-for="(category, index) in sideCategories"
          :key="category"
          class="tasks-side__item"
          :style="{ animationDelay: sideDelay(index + 1) }"
        >
          <button
            type="button"
            class="tasks-side__category"
            :class="[
              catClass(category),
              { 'tasks-side__category--active': activeCategory === category },
            ]"
            :aria-pressed="activeCategory === category"
            :title="category"
            @click="pickCategory(category)"
          >
            <span class="tasks-side__dot" aria-hidden="true" />
            <span class="tasks-side__category-text">{{ category }}</span>
          </button>
        </li>
      </ul>
      <p class="tasks-side__note">Самые частые среди загруженных задач</p>

      <section class="tasks-side__card tasks-side__legend">
        <p class="tasks-side__title">Обозначения</p>
        <p class="tasks-side__legend-row">
          <span class="tasks__card-mark tasks__card-mark--solved">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
            </svg>
            Решена
          </span>
          вы уже решили верно
        </p>
        <p class="tasks-side__legend-row">
          <span class="tasks__card-mark tasks__card-mark--tried">
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" /></svg>
            Были попытки
          </span>
          пока без верного ответа
        </p>
        <p class="tasks-side__note tasks-side__note--card">
          Подержите курсор на карточке — покажу граф и полное условие.
        </p>
      </section>
    </aside>

    <main ref="page" class="tasks">
      <header class="tasks__header">
        <TasksConstellation v-if="lively" class="tasks__sky" />
        <div class="tasks__heading">
          <h1 class="tasks__title">Задачи</h1>
          <p class="tasks__lead">Выберите задачу, постройте граф — и проверьте решение сразу.</p>
        </div>
        <svg v-if="lively" class="tasks__art" viewBox="0 0 162 54" aria-hidden="true">
          <path
            v-for="(edge, index) in ART_EDGES"
            :key="'edge-' + index"
            class="tasks__art-edge"
            :d="edgePath(edge)"
            pathLength="1"
            :style="{ animationDelay: edgeDelay(index) }"
          />
          <circle
            v-for="(node, index) in ART_NODES"
            :key="'node-' + index"
            class="tasks__art-node"
            :cx="node.x"
            :cy="node.y"
            r="6"
            :style="{ animationDelay: nodeDelay(index) }"
          />
          <circle v-if="lively" class="tasks__art-token" r="3.5">
            <animateMotion :path="ART_ROUTE" dur="7s" begin="1.2s" repeatCount="indefinite" />
          </circle>
        </svg>
        <RouterLink v-if="canCreate" class="tasks__create" :to="{ name: 'constructor' }">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5 V19 M5 12 H19" />
          </svg>
          Создать задачу
        </RouterLink>
      </header>

      <form
        class="tasks__search"
        :class="{ 'tasks__search--stuck': stuck }"
        role="search"
        @submit.prevent="runSearch"
      >
        <label class="tasks__field tasks__field--main">
          <svg
            class="tasks__field-icon"
            :class="{ 'tasks__field-icon--busy': loading }"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16 L20.5 20.5" />
          </svg>
          <input
            ref="nameInput"
            v-model="filter.name"
            class="tasks__input"
            type="search"
            :placeholder="placeholder"
            aria-label="Название задачи"
            autocomplete="off"
            @focus="nameFocused = true"
            @blur="nameFocused = false"
          />
          <kbd
            v-if="filter.name === '' && !nameFocused"
            class="tasks__kbd"
            title="Нажмите / для поиска"
          >
            /
          </kbd>
          <Transition name="tasks-pop">
            <button
              v-if="filter.name !== ''"
              type="button"
              class="tasks__clear"
              aria-label="Очистить название"
              @click="clearName"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4 L12 12 M12 4 L4 12" />
              </svg>
            </button>
          </Transition>
        </label>
        <label class="tasks__field tasks__field--category">
          <svg class="tasks__field-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4 H11 L20 13 L13 20 L4 11 Z" />
            <circle cx="8" cy="8" r="1.5" />
          </svg>
          <input
            v-model="filter.category"
            class="tasks__input"
            type="search"
            placeholder="Категория"
            aria-label="Категория"
            autocomplete="off"
          />
          <Transition name="tasks-pop">
            <button
              v-if="filter.category !== ''"
              type="button"
              class="tasks__clear"
              aria-label="Очистить категорию"
              @click="clearCategory"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4 L12 12 M12 4 L4 12" />
              </svg>
            </button>
          </Transition>
        </label>
        <span v-if="loading" class="tasks__progress" aria-hidden="true" />
      </form>

      <div v-if="categories.length > 0" class="tasks__chips" aria-label="Частые категории">
        <button
          v-for="(category, index) in categories"
          :key="category"
          type="button"
          class="tasks__chip"
          :class="{ 'tasks__chip--active': activeCategory === category }"
          :aria-pressed="activeCategory === category"
          :style="{ animationDelay: chipDelay(index) }"
          @click="pickCategory(category)"
        >
          <svg
            v-if="activeCategory === category"
            class="tasks__chip-check"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
          </svg>
          {{ category }}
        </button>
      </div>

      <p v-if="countText !== '' && error === null" class="tasks__count" aria-live="polite">
        {{ countText }}<template v-if="shownText !== ''">, {{ shownText }}</template>
      </p>

      <KonigsbergScene v-if="showKonigsberg" />

      <Transition name="tasks-swap" mode="out-in">
        <div
          v-if="error !== null"
          key="error"
          class="tasks__message tasks__message--error"
          role="alert"
        >
          <span>{{ loadErrorText(error) }}</span>
          <UiButton size="sm" @click="runSearch">Повторить</UiButton>
        </div>

        <ul
          v-else-if="loading && tasks.length === 0"
          key="skeleton"
          class="tasks__list"
          aria-label="Загружаю задачи"
        >
          <li
            v-for="(item, index) in SKELETONS"
            :key="item"
            class="tasks__skeleton"
            :style="{ animationDelay: cardDelay(index) }"
          >
            <span class="tasks__skeleton-line tasks__skeleton-line--short" />
            <span class="tasks__skeleton-line tasks__skeleton-line--title" />
            <span class="tasks__skeleton-line" />
          </li>
        </ul>

        <div v-else-if="tasks.length === 0" key="empty" class="tasks__empty">
          <svg class="tasks__empty-art" viewBox="0 0 120 80" aria-hidden="true">
            <path d="M20 60 L50 20 L85 45" />
            <path class="tasks__empty-search" d="M85 45 L105 15" />
            <circle class="tasks__empty-node" cx="20" cy="60" r="7" />
            <circle class="tasks__empty-node" cx="50" cy="20" r="7" />
            <circle class="tasks__empty-node" cx="85" cy="45" r="7" />
            <circle cx="105" cy="15" r="7" class="tasks__empty-lost" />
          </svg>
          <p class="tasks__empty-text">{{ emptyListText(appliedFilter) }}</p>
          <UiButton v-if="!isFilterEmpty(appliedFilter)" size="sm" @click="resetFilter">
            Сбросить поиск
          </UiButton>
        </div>

        <ul
          v-else
          ref="list"
          :key="'list-' + generation"
          class="tasks__list"
          :class="{
            'tasks__list--stale': searching,
            'tasks__list--linked': linkScene !== null,
          }"
        >
          <li
            v-for="(task, index) in tasks"
            :key="task.id"
            class="tasks__item"
            :style="{ animationDelay: cardDelay(index), '--link-index': String(index % 24) }"
          >
            <RouterLink
              class="tasks__card"
              :class="catClass(task.category)"
              :to="{ name: 'task', params: { id: task.id } }"
              @pointerenter="onCardEnter(task, $event)"
              @pointermove="onCardMove"
              @pointerleave="onCardLeave"
              @click="onCardClick(task, $event)"
            >
              <TaskGraphThumb class="tasks__thumb" :task-id="task.id" />
              <span
                v-if="task.category !== '' || !task.isPublic || markOf(task.id) !== undefined"
                class="tasks__card-top"
              >
                <span
                  v-if="markOf(task.id) !== undefined"
                  class="tasks__card-mark"
                  :class="'tasks__card-mark--' + markOf(task.id)"
                >
                  <svg v-if="markOf(task.id) === 'solved'" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                  </svg>
                  <svg v-else viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="8" r="3" />
                  </svg>
                  {{ markTitle(markOf(task.id)) }}
                </span>
                <span v-if="task.category !== ''" class="tasks__card-category">
                  {{ task.category }}
                </span>
                <span v-if="!task.isPublic" class="tasks__card-hidden">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M3 3 L21 21 M10.5 6.2 C11 6.1 11.5 6 12 6 C17 6 20 12 20 12 C19.4 13.2 18.6 14.3 17.6 15.2 M14.1 14.2 A3 3 0 0 1 9.8 9.9 M6.4 7.6 C4.6 9 4 12 4 12 C4 12 7 18 12 18 C13.6 18 15 17.4 16.2 16.6"
                    />
                  </svg>
                  Видна не всем
                </span>
              </span>
              <span class="tasks__card-name">
                <template
                  v-for="(part, position) in highlightParts(task.name, appliedFilter.name)"
                  :key="position"
                >
                  <mark v-if="part.match" class="tasks__mark">{{ part.text }}</mark>
                  <template v-else>{{ part.text }}</template>
                </template>
              </span>
              <span v-if="task.description !== ''" class="tasks__card-description">
                {{ task.description }}
              </span>
              <span v-if="task.author !== ''" class="tasks__card-author">
                <span class="tasks__avatar" aria-hidden="true">{{ initials(task.author) }}</span>
                {{ task.author }}
              </span>
              <svg class="tasks__card-go" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6 L15 12 L9 18" />
              </svg>
            </RouterLink>
          </li>
        </ul>
      </Transition>

      <svg
        v-if="linkScene !== null"
        :key="linkScene.key"
        class="tasks__links"
        :width="linkScene.width"
        :height="linkScene.height"
        aria-hidden="true"
      >
        <line
          v-for="(link, index) in linkScene.links"
          :key="'link-' + index"
          class="tasks__link"
          v-bind="linkLine(link)"
          pathLength="1"
          :style="{ animationDelay: linkDelay(index) }"
        />
        <circle
          v-for="(point, index) in linkScene.points"
          :key="'point-' + index"
          class="tasks__link-point"
          :cx="point.x"
          :cy="point.y"
          r="7"
          :style="{ animationDelay: linkDelay(index) }"
        />
      </svg>
      <Transition name="tasks-pop">
        <p v-if="linkScene !== null" class="tasks__secret" role="status">
          Г-Р-А-Ф: задачи взялись за руки
        </p>
      </Transition>

      <div ref="sentinel" class="tasks__sentinel" aria-hidden="true" />

      <div
        v-if="loading && !searching && tasks.length > 0"
        class="tasks__dots"
        aria-label="Загружаю ещё"
      >
        <span class="tasks__dot" />
        <span class="tasks__dot" />
        <span class="tasks__dot" />
      </div>
      <UiButton
        v-else-if="hasNext && error === null && tasks.length > 0"
        class="tasks__more"
        @click="onLoadMore"
      >
        Показать ещё
      </UiButton>

      <TaskPreviewPopover
        v-if="preview !== null"
        :key="preview.task.id"
        :task="preview.task"
        :left="preview.left"
        :top="preview.top"
        :color-class="catClass(preview.task.category)"
      />

      <Transition name="tasks-pop">
        <button
          v-if="showTop"
          type="button"
          class="tasks__top"
          title="Наверх"
          aria-label="Наверх"
          @click="scrollToTop"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19 V5 M6 11 L12 5 L18 11" />
          </svg>
        </button>
      </Transition>
    </main>

    <aside class="tasks-side tasks-side--right" aria-label="Ещё">
      <section class="tasks-side__card tasks-side__card--luck">
        <button
          type="button"
          class="tasks-side__luck"
          :class="{
            'tasks-side__luck--rolling': rolling,
            'tasks-side__luck--hop-a': rolling && impatience > 0 && impatience % 2 === 0,
            'tasks-side__luck--hop-b': rolling && impatience % 2 === 1,
          }"
          :disabled="totalCount === 0"
          :aria-busy="rolling"
          @click="onLucky"
        >
          <svg class="tasks-side__die" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="3" y="3" width="26" height="26" rx="7" />
            <circle cx="10" cy="10" r="2.4" />
            <circle cx="22" cy="10" r="2.4" />
            <circle cx="16" cy="16" r="2.4" />
            <circle cx="10" cy="22" r="2.4" />
            <circle cx="22" cy="22" r="2.4" />
          </svg>
          <span class="tasks-side__luck-words">
            <span class="tasks-side__luck-title">Случайная задача</span>
            <span class="tasks-side__luck-text">{{ luckText }}</span>
          </span>
        </button>
      </section>

      <section class="tasks-side__card">
        <GraphFactCard />
      </section>

      <section v-if="recent.length > 0" class="tasks-side__card">
        <div class="tasks-side__head">
          <p class="tasks-side__title">Недавно открытые</p>
          <button type="button" class="tasks-side__clear" @click="clearRecent">Очистить</button>
        </div>
        <ul class="tasks-side__recent">
          <li
            v-for="(task, index) in recent"
            :key="task.id"
            class="tasks-side__item"
            :style="{ animationDelay: sideDelay(index) }"
          >
            <RouterLink
              class="tasks-side__recent-link"
              :to="{ name: 'task', params: { id: task.id } }"
              :title="task.name"
              @click="onRecentClick(task, $event)"
            >
              <svg
                v-if="markOf(task.id) === 'solved'"
                class="tasks-side__recent-solved"
                viewBox="0 0 24 24"
                aria-label="решена"
              >
                <path d="M5 12.5 L10 17.5 L19 7" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5 V12 L15 14" />
              </svg>
              <span class="tasks-side__recent-text">{{ task.name || "Без названия" }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="tasks-side__card">
        <p class="tasks-side__title">Быстрые клавиши</p>
        <dl class="tasks-side__keys">
          <div class="tasks-side__key">
            <dt><kbd>/</kbd></dt>
            <dd>к поиску</dd>
          </div>
          <div class="tasks-side__key">
            <dt><kbd>Esc</kbd></dt>
            <dd>очистить поиск</dd>
          </div>
          <div class="tasks-side__key">
            <dt><kbd>Ctrl</kbd> + <kbd>Enter</kbd></dt>
            <dd>проверить решение в задаче</dd>
          </div>
        </dl>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.tasks {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 920px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) var(--space-6);
}

.tasks__header {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
}

.tasks__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  animation: tasks-rise 420ms var(--ease-out) both;
}

.tasks__title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}

.tasks__lead {
  margin: 0;
  color: var(--color-text-muted);
}

.tasks__art {
  flex-shrink: 0;
  width: 162px;
  height: 54px;
  margin-left: auto;
  overflow: visible;
}

.tasks__art-edge {
  fill: none;
  stroke: var(--graph-edge);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  animation: tasks-draw 520ms var(--ease-out) both;
}

.tasks__art-node {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-vertex-stroke);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation:
    tasks-node-pop 460ms var(--ease-spring) both,
    tasks-breathe 3.2s ease-in-out 1.4s infinite;
}

.tasks__art-token {
  fill: var(--graph-active);
  filter: drop-shadow(0 0 4px var(--graph-active));
}

.tasks__create {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  animation: tasks-rise 420ms var(--ease-out) 120ms backwards;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.tasks__create:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-accent);
  transform: translateY(-1px);
}

.tasks__create:active {
  transform: scale(0.97);
}

.tasks__create:focus-visible,
.tasks__chip:focus-visible,
.tasks__card:focus-visible,
.tasks__clear:focus-visible,
.tasks__top:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.tasks__create svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  transition: transform var(--duration) var(--ease-spring);
}

.tasks__create:hover svg {
  transform: rotate(90deg);
}

.tasks__search {
  position: sticky;
  top: var(--space-2);
  z-index: 2;
  display: flex;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: tasks-rise 420ms var(--ease-out) 60ms backwards;
  transition:
    box-shadow var(--duration) var(--ease-out),
    border-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.tasks__search:focus-within {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-accent);
}

.tasks__search--stuck {
  box-shadow: var(--shadow-popover);
  transform: scale(1.01);
}

.tasks__field {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.tasks__field:focus-within {
  background: var(--color-page);
  box-shadow: 0 0 0 2px var(--color-accent-muted);
}

.tasks__field--main {
  flex: 1;
}

.tasks__field--category {
  width: 240px;
  border-left: 1px solid var(--color-border);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.tasks__field-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition:
    stroke var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.tasks__field:focus-within .tasks__field-icon {
  stroke: var(--color-accent);
  transform: scale(1.12) rotate(-8deg);
}

.tasks__field-icon--busy {
  stroke: var(--color-accent);
  animation: tasks-scan 900ms ease-in-out infinite;
}

.tasks__input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-lg);
}

.tasks__input::-webkit-search-cancel-button {
  display: none;
}

.tasks__field--category .tasks__input {
  font-size: var(--font-size-md);
}

.tasks__progress {
  position: absolute;
  right: var(--space-3);
  bottom: 0;
  left: var(--space-3);
  height: 2px;
  overflow: hidden;
  border-radius: 2px;
}

.tasks__progress::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  border-radius: 2px;
  background: var(--color-accent);
  animation: tasks-progress 1s var(--ease-out) infinite;
}

.tasks__clear {
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
  transition:
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.tasks__clear:hover {
  color: var(--color-text);
  transform: rotate(90deg);
}

.tasks__clear svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.tasks__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tasks__chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
  animation: tasks-chip-in 360ms var(--ease-spring) backwards;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.tasks__chip:hover {
  border-color: var(--color-accent);
  color: var(--color-text);
  transform: translateY(-2px);
}

.tasks__chip:active {
  transform: scale(0.94);
}

.tasks__chip--active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.tasks__chip--active:hover {
  color: var(--color-on-accent);
}

.tasks__chip-check {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 16;
  animation: tasks-check 320ms var(--ease-out) both;
}

.tasks__count {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.tasks__message {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.tasks__message--error {
  border: 1px solid var(--color-danger);
  background: var(--graph-red-fill);
  color: var(--color-text);
  animation: tasks-shake 420ms var(--ease-out);
}

.tasks__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  transition:
    opacity var(--duration) var(--ease-out),
    filter var(--duration) var(--ease-out);
}

.tasks__list--stale {
  opacity: 0.5;
  filter: saturate(0.5);
  pointer-events: none;
}

.tasks__item {
  animation: tasks-card-in 460ms var(--ease-out) both;
}

.tasks__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) 168px var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring),
    box-shadow var(--duration) var(--ease-out);
}

.tasks__card::before {
  content: "";
  position: absolute;
  top: var(--space-3);
  bottom: var(--space-3);
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--cat, var(--color-accent));
  transform: scaleY(0);
  transition: transform var(--duration) var(--ease-spring);
}

.tasks__card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    280px circle at var(--spot-x, 50%) var(--spot-y, 50%),
    color-mix(in srgb, var(--color-accent) 12%, transparent),
    transparent 70%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration) var(--ease-out);
}

.tasks__card:hover {
  border-color: var(--cat, var(--color-accent));
  box-shadow: var(--shadow-popover);
  transform: perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))
    translateY(-3px);
}

.tasks__card:active {
  transform: perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))
    translateY(-1px) scale(0.99);
}

.tasks__card:hover::before,
.tasks__card:focus-visible::before {
  transform: scaleY(1);
}

.tasks__card:hover::after {
  opacity: 1;
}

.tasks__card-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.tasks__card-category {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--cat, var(--color-accent)) 16%, transparent);
  color: var(--cat, var(--color-accent));
  font-size: 12px;
  font-weight: 600;
}

.tasks-cat-0 {
  --cat: var(--color-accent);
}

.tasks-cat-1 {
  --cat: var(--graph-active);
}

.tasks-cat-2 {
  --cat: var(--color-success);
}

.tasks-cat-3 {
  --cat: var(--color-danger);
}

.tasks-cat-4 {
  --cat: color-mix(in oklch, var(--color-accent), var(--color-danger));
}

.tasks-cat-5 {
  --cat: color-mix(in oklch, var(--graph-active), var(--color-success));
}

.tasks__card-mark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px var(--space-2) 2px 4px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  animation: tasks-chip-in 360ms var(--ease-spring) 200ms backwards;
}

.tasks__card-mark svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tasks__card-mark--solved {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.tasks__card-mark--tried {
  background: color-mix(in srgb, var(--graph-active) 18%, transparent);
  color: var(--graph-active);
}

.tasks__card-mark--tried svg {
  fill: currentColor;
}

.tasks__card-hidden {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.tasks__card-hidden svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.tasks__card-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  line-height: 1.35;
  transition: color var(--duration-fast) var(--ease-out);
}

.tasks__card:hover .tasks__card-name {
  color: var(--color-accent);
}

.tasks__mark {
  padding: 0 2px;
  border-radius: 3px;
  background-color: transparent;
  background-image: linear-gradient(
    color-mix(in srgb, var(--graph-active) 35%, transparent),
    color-mix(in srgb, var(--graph-active) 35%, transparent)
  );
  background-repeat: no-repeat;
  background-size: 100% 100%;
  color: inherit;
  animation: tasks-mark 520ms var(--ease-out) 260ms both;
}

.tasks__card-description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text-muted);
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tasks__card-author {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.tasks__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-surface-hover);
  color: var(--color-text);
  font-size: 10px;
  font-weight: 700;
  transition:
    background-color var(--duration) var(--ease-out),
    color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.tasks__card:hover .tasks__avatar {
  background: var(--color-accent);
  color: var(--color-on-accent);
  transform: scale(1.12);
}

.tasks__card-go {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  width: 22px;
  height: 22px;
  margin-top: -11px;
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: translateX(-8px);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.tasks__card:hover .tasks__card-go,
.tasks__card:focus-visible .tasks__card-go {
  opacity: 1;
  transform: none;
  animation: tasks-nudge 1.2s ease-in-out 300ms infinite;
}

.tasks__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  animation: tasks-rise 360ms var(--ease-out) both;
}

.tasks__skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--color-surface-hover) 25%,
    var(--color-border) 50%,
    var(--color-surface-hover) 75%
  );
  background-size: 200% 100%;
  animation: tasks-shimmer 1.2s linear infinite;
}

.tasks__skeleton-line--short {
  width: 90px;
}

.tasks__skeleton-line--title {
  width: 55%;
  height: 18px;
}

.tasks__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  animation: tasks-empty-in 420ms var(--ease-spring) both;
}

.tasks__empty-art {
  width: 120px;
  height: 80px;
  overflow: visible;
  fill: var(--color-surface);
  stroke: var(--color-text-muted);
  stroke-width: 2;
}

.tasks__empty-art path {
  fill: none;
}

.tasks__empty-search {
  stroke: var(--graph-active);
  stroke-dasharray: 3 4;
  animation: tasks-march 900ms linear infinite;
}

.tasks__empty-node {
  transform-box: fill-box;
  transform-origin: center;
  animation: tasks-breathe 2.4s ease-in-out infinite;
}

.tasks__empty-node:nth-of-type(2) {
  animation-delay: 300ms;
}

.tasks__empty-node:nth-of-type(3) {
  animation-delay: 600ms;
}

.tasks__empty-lost {
  stroke: var(--graph-active);
  stroke-dasharray: 4 3;
  transform-box: fill-box;
  transform-origin: center;
  animation:
    tasks-float 2.4s ease-in-out infinite,
    tasks-march 1.4s linear infinite;
}

.tasks__empty-text {
  margin: 0;
  color: var(--color-text-muted);
}

.tasks__sentinel {
  height: 1px;
}

.tasks__more {
  align-self: center;
  animation: tasks-rise 300ms var(--ease-out) backwards;
}

.tasks__dots {
  position: relative;
  display: flex;
  align-self: center;
  gap: 22px;
  padding: var(--space-2) 0;
}

.tasks__dots::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 5px;
  left: 5px;
  height: 2px;
  margin-top: -1px;
  background: var(--graph-edge);
}

.tasks__dot {
  position: relative;
  width: 12px;
  height: 12px;
  border: 2px solid var(--graph-vertex-stroke);
  border-radius: 50%;
  background: var(--graph-vertex-fill);
  animation: tasks-hop 900ms ease-in-out infinite;
}

.tasks__dot:nth-child(2) {
  animation-delay: 150ms;
}

.tasks__dot:nth-child(3) {
  animation-delay: 300ms;
}

.tasks__top {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  color: var(--color-accent);
  cursor: pointer;
  transition:
    transform var(--duration) var(--ease-spring),
    border-color var(--duration-fast) var(--ease-out);
}

.tasks__top:hover {
  border-color: var(--color-accent);
  transform: translateY(-3px);
}

.tasks__top svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tasks__top:hover svg {
  animation: tasks-lift 700ms ease-in-out infinite;
}

.tasks-pop-enter-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform 320ms var(--ease-spring);
}

.tasks-pop-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.tasks-pop-enter-from,
.tasks-pop-leave-to {
  opacity: 0;
  transform: scale(0.4);
}

.tasks-swap-enter-active {
  transition: opacity var(--duration) var(--ease-out);
}

.tasks-swap-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.tasks-swap-enter-from {
  opacity: 0;
}

.tasks-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
}

.tasks-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.tasks-side {
  display: none;
}

.tasks__kbd,
.tasks-side__keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-page);
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
}

.tasks__kbd {
  flex-shrink: 0;
  animation: tasks-chip-in 300ms var(--ease-spring) backwards;
}

.tasks-side__title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.tasks-side__list,
.tasks-side__recent {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tasks-side__item {
  animation: tasks-side-in 380ms var(--ease-out) backwards;
}

.tasks-side--right .tasks-side__item {
  animation-name: tasks-side-in-right;
}

.tasks-side__category {
  position: relative;
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
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    padding-left var(--duration) var(--ease-spring);
}

.tasks-side__category::before {
  content: "";
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
  transform: scaleY(0);
  transition: transform var(--duration) var(--ease-spring);
}

.tasks-side__category:hover {
  padding-left: calc(var(--space-3) + 3px);
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.tasks-side__category--active {
  background: var(--color-accent-muted);
  color: var(--color-text);
  font-weight: 600;
}

.tasks-side__category--active::before {
  transform: scaleY(1);
}

.tasks-side__category:focus-visible,
.tasks-side__luck:focus-visible,
.tasks-side__recent-link:focus-visible,
.tasks-side__clear:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.tasks-side__category-text,
.tasks-side__recent-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tasks-side__all {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  fill: var(--color-accent);
}

.tasks-side__dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border: 2px solid var(--cat, currentColor);
  border-radius: 50%;
  transition: transform var(--duration) var(--ease-spring);
}

.tasks-side__category:hover .tasks-side__dot,
.tasks-side__category--active .tasks-side__dot {
  background: var(--cat, currentColor);
  transform: scale(1.2);
}

.tasks-side__note {
  margin: 0;
  padding: 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: 12px;
  opacity: 0.8;
}

.tasks-side__card {
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
  animation: tasks-side-in-right 420ms var(--ease-out) backwards;
  transition:
    border-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring),
    box-shadow var(--duration) var(--ease-out);
}

.tasks-side__card:hover {
  border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

.tasks-side__card--luck {
  border-color: transparent;
  background:
    linear-gradient(var(--color-surface), var(--color-surface)) padding-box,
    conic-gradient(
        from var(--luck-angle),
        var(--color-accent),
        var(--graph-active),
        var(--color-success),
        var(--color-accent)
      )
      border-box;
  animation:
    tasks-side-in-right 420ms var(--ease-out) backwards,
    tasks-luck-turn 6s linear infinite;
}

.tasks-side__card--luck:hover {
  border-color: transparent;
  box-shadow: 0 10px 28px color-mix(in srgb, var(--color-accent) 25%, transparent);
}

.tasks-side__legend {
  margin-top: var(--space-2);
  animation-name: tasks-side-in;
}

.tasks-side__legend-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
}

.tasks-side__note--card {
  padding: 0;
}

.tasks-side__recent-solved {
  stroke: var(--color-success) !important;
  stroke-width: 2.6 !important;
}

.tasks-side__card:nth-child(2) {
  animation-delay: 120ms;
}

.tasks-side__card:nth-child(3) {
  animation-delay: 240ms;
}

.tasks-side__card:nth-child(4) {
  animation-delay: 360ms;
}

.tasks-side__luck {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tasks-side__luck:disabled {
  cursor: default;
  opacity: 0.5;
}

.tasks-side__die {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  transition: transform 380ms var(--ease-spring);
}

.tasks-side__die rect {
  fill: var(--color-accent-muted);
  stroke: var(--color-accent);
  stroke-width: 2;
}

.tasks-side__die circle {
  fill: var(--color-accent);
}

.tasks-side__luck:hover:not(:disabled) .tasks-side__die {
  transform: rotate(-18deg) scale(1.08);
}

.tasks-side__luck--rolling .tasks-side__die {
  animation: tasks-roll 500ms var(--ease-out) infinite;
}

.tasks-side__luck--rolling .tasks-side__die circle {
  animation: tasks-pips 250ms steps(2) infinite;
}

.tasks-side__luck-words {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tasks-side__luck-title {
  font-weight: 700;
  transition: color var(--duration-fast) var(--ease-out);
}

.tasks-side__luck:hover:not(:disabled) .tasks-side__luck-title {
  color: var(--color-accent);
}

.tasks-side__luck-text {
  color: var(--color-text-muted);
  font-size: 12px;
}

.tasks-side__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.tasks-side__clear {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.tasks-side__clear:hover {
  color: var(--color-danger);
}

.tasks-side__recent-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.tasks-side__recent-link:hover {
  background: var(--color-surface-hover);
  transform: translateX(3px);
}

.tasks-side__recent-link svg {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke var(--duration-fast) var(--ease-out);
}

.tasks-side__recent-link:hover svg {
  stroke: var(--color-accent);
}

.tasks-side__keys {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.tasks-side__key {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
}

.tasks-side__key dt {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.tasks-side__key dd {
  margin: 0;
  color: var(--color-text-muted);
}

@media (min-width: 1280px) {
  .tasks-page {
    grid-template-columns: 210px minmax(0, 880px) 250px;
    justify-content: center;
    column-gap: var(--space-6);
    padding: 0 var(--space-4);
  }

  .tasks-side {
    position: sticky;
    top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-self: start;
    margin-top: calc(var(--space-6) + 110px);
  }

  .tasks {
    width: 100%;
    padding-right: 0;
    padding-left: 0;
  }

  .tasks__chips {
    display: none;
  }
}

@property --luck-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes tasks-luck-turn {
  to {
    --luck-angle: 360deg;
  }
}

@keyframes tasks-side-in {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
}

@keyframes tasks-side-in-right {
  from {
    opacity: 0;
    transform: translateX(14px);
  }
}

@keyframes tasks-roll {
  0% {
    transform: rotate(0deg) translateY(0);
  }
  50% {
    transform: rotate(180deg) translateY(-4px) scale(0.92);
  }
  100% {
    transform: rotate(360deg) translateY(0);
  }
}

@keyframes tasks-pips {
  to {
    opacity: 0.2;
  }
}

.tasks__sky {
  position: absolute;
  top: -40px;
  left: -60px;
  z-index: 0;
  width: calc(100% + 120px);
  height: calc(100% + 56px);
  pointer-events: none;
}

.tasks__header > :not(.tasks__sky) {
  position: relative;
  z-index: 1;
}

.tasks__thumb {
  position: absolute;
  top: 50%;
  right: 52px;
  margin-top: -32px;
}

.tasks__card:hover :deep(.graph-mini__line) {
  stroke: var(--color-accent);
  animation: tasks-thumb-draw 700ms var(--ease-out) calc(var(--mini-index) * 40ms) backwards;
}

.tasks__card:hover :deep(.graph-mini__vertex) {
  animation: tasks-thumb-pop 420ms var(--ease-spring) calc(var(--mini-index) * 35ms) backwards;
}

.tasks__links {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 4;
  overflow: visible;
  pointer-events: none;
}

.tasks__link {
  stroke: var(--graph-active);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 1;
  animation:
    tasks-draw 520ms var(--ease-out) backwards,
    tasks-fade-out 400ms ease-in 1.9s forwards;
}

.tasks__link-point {
  fill: var(--graph-vertex-fill);
  stroke: var(--graph-active);
  stroke-width: 2.5;
  transform-box: fill-box;
  transform-origin: center;
  animation:
    tasks-node-pop 420ms var(--ease-spring) backwards,
    tasks-fade-out 400ms ease-in 1.9s forwards;
}

.tasks__list--linked .tasks__item {
  animation: tasks-link-hop 640ms var(--ease-spring) calc(var(--link-index) * 70ms);
}

.tasks__secret {
  position: fixed;
  right: 0;
  bottom: var(--space-5);
  left: 0;
  z-index: 5;
  width: max-content;
  margin: 0 auto;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--graph-active);
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  font-weight: 700;
}

.tasks-side__luck--hop-a .tasks-side__die {
  animation: tasks-die-hop-a 520ms var(--ease-spring);
}

.tasks-side__luck--hop-b .tasks-side__die {
  animation: tasks-die-hop-b 520ms var(--ease-spring);
}

@keyframes tasks-thumb-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes tasks-thumb-pop {
  from {
    transform: scale(0);
  }
}

@keyframes tasks-fade-out {
  to {
    opacity: 0;
  }
}

@keyframes tasks-link-hop {
  40% {
    transform: translateY(-6px) scale(1.01);
  }
}

@keyframes tasks-die-hop-a {
  40% {
    transform: translateY(-18px) rotate(200deg) scale(1.15);
  }
}

@keyframes tasks-die-hop-b {
  40% {
    transform: translateY(-18px) rotate(-200deg) scale(1.15);
  }
}

@keyframes tasks-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes tasks-card-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
}

@keyframes tasks-chip-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes tasks-empty-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
}

@keyframes tasks-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes tasks-node-pop {
  from {
    opacity: 0;
    transform: scale(0);
  }
}

@keyframes tasks-breathe {
  50% {
    transform: scale(1.12);
  }
}

@keyframes tasks-scan {
  0%,
  100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(2px, -2px);
  }
  50% {
    transform: translate(0, -3px);
  }
  75% {
    transform: translate(-2px, -1px);
  }
}

@keyframes tasks-progress {
  from {
    left: -35%;
  }
  to {
    left: 100%;
  }
}

@keyframes tasks-check {
  from {
    stroke-dashoffset: 16;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes tasks-mark {
  from {
    background-size: 0% 100%;
  }
}

@keyframes tasks-nudge {
  50% {
    transform: translateX(4px);
  }
}

@keyframes tasks-shake {
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

@keyframes tasks-shimmer {
  to {
    background-position: -200% 0;
  }
}

@keyframes tasks-float {
  50% {
    transform: translateY(-5px);
  }
}

@keyframes tasks-march {
  to {
    stroke-dashoffset: -14;
  }
}

@keyframes tasks-hop {
  0%,
  60%,
  100% {
    transform: translateY(0);
    border-color: var(--graph-vertex-stroke);
  }
  30% {
    transform: translateY(-8px);
    border-color: var(--graph-active);
  }
}

@keyframes tasks-lift {
  50% {
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tasks__art-node,
  .tasks__field-icon--busy,
  .tasks__card-go,
  .tasks__empty-search,
  .tasks__empty-node,
  .tasks__empty-lost,
  .tasks__dot,
  .tasks__top svg {
    animation: none !important;
  }
}

@media (max-width: 640px) {
  .tasks__search {
    flex-direction: column;
  }

  .tasks__search--stuck {
    transform: none;
  }

  .tasks__field--category {
    width: auto;
    border-top: 1px solid var(--color-border);
    border-left: none;
    border-radius: var(--radius-md);
  }

  .tasks__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tasks__art,
  .tasks__thumb {
    display: none;
  }

  .tasks__card {
    padding-right: 56px;
  }

  .tasks__top {
    right: var(--space-4);
    bottom: var(--space-4);
  }
}
</style>
