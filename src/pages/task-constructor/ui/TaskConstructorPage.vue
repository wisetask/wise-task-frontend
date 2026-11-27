<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import { RouterLink } from "vue-router";
import { setDirected } from "@/entities/graph";
import { useUserStore } from "@/entities/user";
import {
  addCondition,
  conditionFromPlugin,
  pluginFitsTask,
  PluginPicker,
  TaskConditionsEditor,
  usePlugins,
  type Plugin,
} from "@/features/task-conditions";
import { categoryColor } from "@/shared/lib/categoryColor";
import { motionAllowed } from "@/shared/lib/motion";
import { UiButton, UiCheckbox, UiTextArea, UiTextField } from "@/shared/ui";
import {
  DIRECTION_TITLES,
  DIRECTIONS,
  GraphEditor,
  GraphRulesForm,
  withDirection,
  type GraphDirection,
} from "@/widgets/graph-editor";
import { GraphMiniature, TaskCondition } from "@/widgets/task-view";
import {
  canPickAnswerDirection,
  createTaskDraft,
  draftProblems,
  draftReadiness,
  draftTabs,
  draftTitle,
  graphForRules,
  studentHints,
  studentRules,
  studentStartGraph,
  studentView,
  tabIsDone,
  targetTab,
  taskGraph,
  type ConstructorTab,
  type ReadinessTarget,
  type TaskDraft,
} from "../model/taskDraft";
import { useCreateTask, type CreatedTask } from "../model/useCreateTask";
import { graphTypeInput } from "../model/taskInput";
import {
  buildTemplate,
  findTemplate,
  GRAPH_TEMPLATES,
  type TemplateId,
} from "../model/graphTemplates";
import { graphEgg, textEgg, type Egg, type SketchId } from "../model/constructorEggs";
import { categoryIdeas, DESCRIPTION_STARTS, withStart } from "../model/suggestions";
import {
  readinessMood,
  readinessShare,
  RING_RADIUS,
  ringLength,
  ringOffset,
} from "../model/readinessRing";
import { createErrorMessage } from "../lib/createError";
import { browserStorage, clearDraft, loadDraft, saveDraft } from "../lib/savedDraft";
import { vertexBurst } from "../lib/vertexBurst";
import ConstructorBackdrop from "./ConstructorBackdrop.vue";

const TOAST_TIME = 7000;
const PING_TIME = 1200;

interface Toast {
  key: number;
  text: string;
  actionText: string;
  action: (() => void) | null;
}

const storage = browserStorage();
const savedDraft = loadDraft(storage);
const draft = ref(savedDraft === null ? createTaskDraft() : savedDraft);
const isSaving = ref(storage !== null);
const savePulse = ref(0);
const isClearing = ref(false);
const activeTab = ref<ConstructorTab>("main");
const loadCatalog = ref(false);
const { plugins, loading: loadingPlugins, error: pluginsError, retry } = usePlugins(loadCatalog);
const graphType = computed(() => graphTypeInput(draft.value.rules.direction));
const incompatibleConditions = computed(() => {
  const pluginsById = new Map<string, Plugin>();
  for (const plugin of plugins.value) {
    pluginsById.set(plugin.id, plugin);
  }
  const numbers: number[] = [];
  for (let index = 0; index < draft.value.conditions.length; index++) {
    const plugin = pluginsById.get(draft.value.conditions[index].pluginId);
    if (plugin !== undefined && !pluginFitsTask(plugin, graphType.value)) {
      numbers.push(index + 1);
    }
  }
  return numbers;
});
const conditionUsage = computed(() => {
  const usage: Record<string, number> = {};
  for (const condition of draft.value.conditions) {
    const count = usage[condition.pluginId];
    usage[condition.pluginId] = count === undefined ? 1 : count + 1;
  }
  return usage;
});
const editor = ref<InstanceType<typeof GraphEditor> | null>(null);
const form = ref<HTMLElement | null>(null);
const checklist = ref<HTMLElement | null>(null);
const createButton = ref<InstanceType<typeof UiButton> | null>(null);

const userStore = useUserStore();
const { createTask, loading: isCreating, error: createError } = useCreateTask();
const createdTask = ref<CreatedTask | null>(null);
const shownProblems = ref<string[]>([]);
const needsSignIn = ref(false);
const errorMessage = computed(() => createErrorMessage(createError.value));
const lively = computed(() => motionAllowed());

const tabs = computed(() => draftTabs(draft.value));
const problems = computed(() => draftProblems(draft.value));
const readiness = computed(() => draftReadiness(draft.value));
const share = computed(() => readinessShare(readiness.value));
const isReady = computed(() => share.value.total > 0 && share.value.done === share.value.total);
const ringDash = ringLength(RING_RADIUS);
const ringShift = computed(() => ringOffset(share.value.percent, RING_RADIUS));
const readinessSummary = computed(() => {
  if (problems.value.length === 0) {
    return "Всё заполнено, задачу можно создавать.";
  }
  return "Осталось заполнить: " + problems.value.length + ".";
});

const trialGraph = ref(studentStartGraph(draft.value));
const trialKey = ref(0);
const trialRules = computed(() => studentRules(draft.value));
const trialHints = computed(() => studentHints(draft.value));
const canPickTrialDirection = computed(() => canPickAnswerDirection(draft.value));
const taskPicture = computed(() => taskGraph(draft.value));
const previewView = computed(() => studentView(draft.value));
const pageTitle = computed(() => draftTitle(draft.value));
const ideas = computed(() => categoryIdeas(draft.value.category));
const cardClass = computed(() => "constructor-cat-" + categoryColor(draft.value.category));
const cardText = computed(() => {
  const text = draft.value.description.trim();
  if (text === "") {
    return "Здесь появится начало описания.";
  }
  if (text.length > 140) {
    return text.slice(0, 140).trimEnd() + "…";
  }
  return text;
});
const cardGraph = computed(() => {
  const graph = taskPicture.value;
  if (graph === null || graph.vertices.length === 0) {
    return null;
  }
  return graph;
});
const stampVertices = computed(() =>
  draft.value.hasGraph ? draft.value.graph.vertices.length : null,
);

const templateGraphs = new Map<TemplateId, ReturnType<typeof buildTemplate>>();
for (const template of GRAPH_TEMPLATES) {
  templateGraphs.set(template.id, buildTemplate(template.id, false));
}
const templatesOpen = ref(draft.value.graph.vertices.length === 0);

const saveStatus = computed(() => {
  if (isSaving.value) {
    return "Черновик сохраняется в браузере";
  }
  return "Браузер не даёт сохранить черновик";
});

const tabButtons = new Map<string, HTMLElement>();
const slider = ref({ x: 0, width: 0 });
const pinged = ref("");
const toast = ref<Toast | null>(null);
const seenEggs = new Set<string>();
const special = ref<SketchId | "">("");
const specialKey = ref(0);
const clearedDraft = ref<TaskDraft | null>(null);
let toastCount = 0;
let toastTimer = 0;
let pingTimer = 0;

function setTabButton(id: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) {
    tabButtons.set(id, element);
  } else {
    tabButtons.delete(id);
  }
}

function placeSlider() {
  const button = tabButtons.get(activeTab.value);
  if (button === undefined) {
    return;
  }
  slider.value = { x: button.offsetLeft, width: button.offsetWidth };
}

function showToast(text: string, actionText = "", action: (() => void) | null = null) {
  toastCount = toastCount + 1;
  toast.value = { key: toastCount, text: text, actionText: actionText, action: action };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = null;
  }, TOAST_TIME);
}

function runToastAction() {
  if (toast.value !== null && toast.value.action !== null) {
    toast.value.action();
  }
  toast.value = null;
}

function tryEgg(egg: Egg | null) {
  if (egg === null || seenEggs.has(egg.id)) {
    return;
  }
  seenEggs.add(egg.id);
  showToast(egg.text);
  if (egg.sketch !== "") {
    special.value = egg.sketch;
    specialKey.value = specialKey.value + 1;
  }
}

function ping(target: string) {
  pinged.value = target;
  window.clearTimeout(pingTimer);
  pingTimer = window.setTimeout(() => {
    pinged.value = "";
  }, PING_TIME);
}

watch(tabs, (newTabs) => {
  let isShown = false;
  for (const tab of newTabs) {
    if (tab.id === activeTab.value) {
      isShown = true;
    }
  }
  if (!isShown) {
    activeTab.value = "main";
  }
  nextTick(placeSlider);
});

watch(
  () => draft.value.rules.direction,
  () => {
    const fixed = graphForRules(draft.value.graph, draft.value.rules);
    if (fixed === draft.value.graph) {
      return;
    }
    if (editor.value !== null) {
      editor.value.replaceGraph(fixed);
    } else {
      draft.value.graph = fixed;
    }
  },
);

watch(problems, (newProblems) => {
  if (shownProblems.value.length > 0) {
    shownProblems.value = newProblems;
  }
});

watch(
  draft,
  (value) => {
    isSaving.value = saveDraft(storage, value);
    savePulse.value = savePulse.value + 1;
  },
  { deep: true },
);

watch(
  () => draft.value.name + "\n" + draft.value.description,
  () => {
    tryEgg(textEgg(draft.value.name, draft.value.description));
  },
);

watch(
  () => draft.value.graph,
  (graph) => {
    if (draft.value.hasGraph) {
      tryEgg(graphEgg(graph));
    }
  },
);

watch(activeTab, (tab) => {
  if (tab === "conditions") {
    loadCatalog.value = true;
  }
  if (tab === "student") {
    restartTrial();
  }
  nextTick(placeSlider);
});

function addPlugin(plugin: Plugin) {
  draft.value.conditions = addCondition(draft.value.conditions, conditionFromPlugin(plugin));
  nextTick(() => {
    if (checklist.value === null) {
      return;
    }
    const cards = checklist.value.querySelectorAll("fieldset");
    const last = cards[cards.length - 1];
    if (last !== undefined && typeof last.scrollIntoView === "function") {
      last.scrollIntoView({ block: "nearest", behavior: lively.value ? "smooth" : "auto" });
    }
  });
}

function insertTemplate(id: TemplateId) {
  const graph = buildTemplate(id, draft.value.graph.isDirected);
  const egg = graphEgg(graph);
  if (egg !== null) {
    seenEggs.add(egg.id);
  }
  const hadGraph = draft.value.graph.vertices.length > 0;
  if (editor.value !== null) {
    editor.value.replaceGraph(graph);
  } else {
    draft.value.graph = graph;
  }
  nextTick(() => {
    if (editor.value !== null) {
      editor.value.fitView();
    }
  });
  const title = findTemplate(id).title;
  if (hadGraph) {
    showToast("«" + title + "» на месте прежнего графа. Ctrl+Z в редакторе вернёт как было.");
  } else {
    showToast("«" + title + "» готов: вершины можно двигать, рёбра менять.");
  }
}

async function openTarget(target: ReadinessTarget) {
  activeTab.value = targetTab(target);
  await nextTick();
  ping(target);
  if (form.value === null) {
    return;
  }
  const box = form.value.querySelector('[data-field="' + target + '"]');
  if (box === null) {
    return;
  }
  const field = box.querySelector("input, textarea");
  if (field instanceof HTMLElement) {
    field.focus();
  }
}

function pickIdea(idea: string) {
  draft.value.category = idea;
  ping("category");
}

function startDescription(start: string) {
  draft.value.description = withStart(draft.value.description, start);
  nextTick(() => {
    if (form.value === null) {
      return;
    }
    const area = form.value.querySelector('[data-field="description"] textarea');
    if (area instanceof HTMLTextAreaElement) {
      area.focus();
      area.setSelectionRange(area.value.length, area.value.length);
    }
  });
}

function restartTrial() {
  trialGraph.value = studentStartGraph(draft.value);
  trialKey.value = trialKey.value + 1;
}

function onTrialDirectedChange(isDirected: boolean) {
  trialGraph.value = setDirected(trialGraph.value, isDirected);
}

function hideNotices() {
  createdTask.value = null;
  shownProblems.value = [];
  needsSignIn.value = false;
}

function startOver() {
  clearDraft(storage);
  draft.value = createTaskDraft();
  activeTab.value = "main";
  isClearing.value = false;
  hideNotices();
}

function clearWithUndo() {
  const old = draft.value;
  startOver();
  clearedDraft.value = old;
  showToast("Черновик очищен.", "Вернуть", restoreCleared);
}

function restoreCleared() {
  if (clearedDraft.value === null) {
    return;
  }
  draft.value = clearedDraft.value;
  clearedDraft.value = null;
}

function buttonElement(): HTMLElement | null {
  if (createButton.value === null) {
    return null;
  }
  const element = createButton.value.$el;
  return element instanceof HTMLElement ? element : null;
}

async function onCreate() {
  hideNotices();
  if (problems.value.length > 0) {
    shownProblems.value = problems.value;
    activeTab.value = "main";
    ping("ring");
    return;
  }
  if (!userStore.isLoggedIn) {
    needsSignIn.value = true;
    return;
  }
  const task = await createTask(draft.value);
  if (task === null) {
    return;
  }
  startOver();
  createdTask.value = task;
  vertexBurst(buttonElement());
}

function setDirection(direction: GraphDirection) {
  draft.value.rules = withDirection(draft.value.rules, direction);
}

function onKeyDown(event: KeyboardEvent) {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    onCreate();
    return;
  }
  if (event.code === "KeyS") {
    event.preventDefault();
    showToast(
      "Черновик и так сохраняется сам после каждой буквы. Но нажимать Ctrl+S приятно, понимаем.",
    );
  }
}

onMounted(() => {
  nextTick(placeSlider);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", placeSlider);
});

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer);
  window.clearTimeout(pingTimer);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("resize", placeSlider);
});
</script>

<template>
  <main class="constructor">
    <ConstructorBackdrop
      :lively="lively"
      :title="pageTitle"
      :category="draft.category"
      :vertices="stampVertices"
      :checks="draft.conditions.length"
      :special="special"
      :special-key="specialKey"
    />

    <header class="constructor__header">
      <div class="constructor__heading">
        <h1 :key="pageTitle" class="constructor__title">{{ pageTitle }}</h1>
        <span class="constructor__status">
          <span
            :key="savePulse"
            class="constructor__save-dot"
            :class="{ 'constructor__save-dot--off': !isSaving }"
          />
          {{ saveStatus }}
        </span>
      </div>
      <nav class="constructor__tabs" role="tablist" aria-label="Части задачи">
        <span
          class="constructor__tab-slider"
          :style="{ transform: 'translateX(' + slider.x + 'px)', width: slider.width + 'px' }"
        />
        <button
          v-for="tab in tabs"
          :id="'constructor-tab-' + tab.id"
          :key="tab.id"
          :ref="(element) => setTabButton(tab.id, element)"
          type="button"
          role="tab"
          class="constructor__tab"
          :class="{ 'constructor__tab--active': activeTab === tab.id }"
          :aria-selected="activeTab === tab.id"
          :aria-controls="'constructor-panel-' + tab.id"
          @click="activeTab = tab.id"
        >
          <svg
            v-if="tab.id === 'student'"
            class="constructor__tab-icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M1.5 8 C4 3.5, 12 3.5, 14.5 8 C12 12.5, 4 12.5, 1.5 8 Z" />
            <circle cx="8" cy="8" r="2" />
          </svg>
          <svg
            v-else-if="tabIsDone(draft, tab.id)"
            :key="'done-' + tab.id"
            class="constructor__tab-icon constructor__tab-icon--done"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M5 8.2 L7.2 10.4 L11 6" />
          </svg>
          <svg v-else class="constructor__tab-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" stroke-dasharray="3 2.2" />
          </svg>
          {{ tab.title }}
        </button>
      </nav>
      <div
        v-if="isClearing"
        class="constructor__actions"
        role="group"
        aria-label="Очистка черновика"
      >
        <span class="constructor__confirm">Удалить всё и начать заново?</span>
        <UiButton variant="danger" size="sm" @click="clearWithUndo">Да, очистить</UiButton>
        <UiButton size="sm" @click="isClearing = false">Отмена</UiButton>
      </div>
      <div v-else class="constructor__actions">
        <UiButton size="sm" @click="isClearing = true">Очистить черновик</UiButton>
        <UiButton
          ref="createButton"
          variant="primary"
          size="sm"
          class="constructor__save"
          :class="{ 'constructor__save--ready': isReady }"
          :loading="isCreating"
          title="Ctrl+Enter"
          @click="onCreate"
        >
          Создать задачу
        </UiButton>
      </div>
    </header>

    <div v-if="createdTask !== null" class="constructor__created" role="status">
      <svg class="constructor__created-mark" viewBox="0 0 64 48" aria-hidden="true">
        <path class="constructor__created-path" d="M10 26 L26 40 L54 10" pathLength="1" />
        <circle class="constructor__created-vertex" cx="10" cy="26" r="5" />
        <circle class="constructor__created-vertex" cx="26" cy="40" r="5" />
        <circle class="constructor__created-vertex" cx="54" cy="10" r="5" />
      </svg>
      <div class="constructor__created-text">
        <strong>Задача «{{ createdTask.name }}» создана.</strong>
        <span>Черновик очищен, можно собирать следующую.</span>
      </div>
      <RouterLink
        class="constructor__created-link"
        :to="{ name: 'task', params: { id: createdTask.id } }"
      >
        Открыть задачу
      </RouterLink>
      <button
        type="button"
        class="constructor__created-close"
        aria-label="Скрыть"
        @click="createdTask = null"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4 L12 12 M12 4 L4 12" />
        </svg>
      </button>
    </div>
    <div
      v-else-if="shownProblems.length > 0"
      class="constructor__notice constructor__notice--error"
      role="alert"
    >
      <span>Чтобы создать задачу, осталось:</span>
      <ul class="constructor__notice-list">
        <li v-for="problem in shownProblems" :key="problem">{{ problem }}</li>
      </ul>
    </div>
    <p v-else-if="needsSignIn" class="constructor__notice constructor__notice--error" role="alert">
      Создавать задачи можно только после входа. Черновик сохранится.
      <RouterLink :to="{ name: 'sign-in', query: { redirect: '/constructor' } }">Войти</RouterLink>
    </p>
    <p
      v-else-if="errorMessage !== ''"
      class="constructor__notice constructor__notice--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <section
      v-if="activeTab === 'main'"
      id="constructor-panel-main"
      class="constructor__panel constructor__panel--form"
      role="tabpanel"
      aria-labelledby="constructor-tab-main"
    >
      <div class="constructor__columns">
        <div ref="form" class="constructor__sheet">
          <div
            class="constructor__field"
            :class="{ 'constructor__field--ping': pinged === 'name' }"
            data-field="name"
          >
            <UiTextField v-model="draft.name" label="Название" required />
          </div>
          <div
            class="constructor__field"
            :class="{ 'constructor__field--ping': pinged === 'category' }"
            data-field="category"
          >
            <UiTextField
              v-model="draft.category"
              label="Категория"
              hint="Например, «Деревья» или «Раскраска»"
              required
            />
            <div
              v-if="ideas.length > 0"
              class="constructor__ideas"
              role="group"
              aria-label="Готовые категории"
            >
              <button
                v-for="(idea, index) in ideas"
                :key="idea"
                type="button"
                class="constructor__idea"
                :style="{ '--index': String(index) }"
                @click="pickIdea(idea)"
              >
                {{ idea }}
              </button>
            </div>
          </div>
          <div
            class="constructor__field"
            :class="{ 'constructor__field--ping': pinged === 'description' }"
            data-field="description"
          >
            <UiTextArea
              v-model="draft.description"
              label="Описание"
              hint="Что нужно сделать студенту. Это он увидит первым."
              :rows="5"
              required
            />
            <div class="constructor__ideas" role="group" aria-label="Начать описание">
              <button
                v-for="(start, index) in DESCRIPTION_STARTS"
                :key="start"
                type="button"
                class="constructor__idea constructor__idea--start"
                :style="{ '--index': String(index) }"
                @click="startDescription(start)"
              >
                {{ start.trim() }}…
              </button>
            </div>
          </div>

          <fieldset class="constructor__kinds">
            <legend class="constructor__kinds-title">Вид графа</legend>
            <div class="constructor__kind-list">
              <label
                v-for="direction in DIRECTIONS"
                :key="direction"
                class="constructor__kind"
                :class="{ 'constructor__kind--active': draft.rules.direction === direction }"
              >
                <input
                  type="radio"
                  name="constructor-graph-kind"
                  class="constructor__kind-input"
                  :value="direction"
                  :checked="draft.rules.direction === direction"
                  @change="setDirection(direction)"
                />
                <svg class="constructor__kind-picture" viewBox="0 0 48 28" aria-hidden="true">
                  <template v-if="direction === 'undirected'">
                    <path d="M9 14 H39" />
                    <circle cx="8" cy="14" r="4.5" />
                    <circle cx="40" cy="14" r="4.5" />
                  </template>
                  <template v-else-if="direction === 'directed'">
                    <path d="M9 14 H34 M29 9 L35 14 L29 19" />
                    <circle cx="8" cy="14" r="4.5" />
                    <circle cx="40" cy="14" r="4.5" />
                  </template>
                  <template v-else>
                    <path d="M9 7 H39" />
                    <path d="M9 21 H34 M30 17.5 L35 21 L30 24.5" />
                    <circle cx="8" cy="7" r="3.5" />
                    <circle cx="40" cy="7" r="3.5" />
                    <circle cx="8" cy="21" r="3.5" />
                    <circle cx="40" cy="21" r="3.5" />
                  </template>
                </svg>
                <span>{{ DIRECTION_TITLES[direction] }}</span>
              </label>
            </div>
            <span class="constructor__hint">
              Если граф задан, он сразу станет такого вида. Если граф рисует студент, другой вид он
              выбрать не сможет.
            </span>
          </fieldset>

          <div class="constructor__switches">
            <label class="constructor__switch">
              <input v-model="draft.hasGraph" type="checkbox" class="constructor__switch-input" />
              <span class="constructor__switch-track" aria-hidden="true">
                <span class="constructor__switch-thumb" />
              </span>
              <span class="constructor__switch-text">
                <span class="constructor__switch-title">Граф задан</span>
                <span class="constructor__hint">
                  Граф будет в условии, а ответ студента начнётся с копии этого графа. Нарисовать
                  граф и решить, что студент может делать с копией, — на вкладке «Граф».
                </span>
              </span>
            </label>
            <label class="constructor__switch">
              <input v-model="draft.isPublic" type="checkbox" class="constructor__switch-input" />
              <span class="constructor__switch-track" aria-hidden="true">
                <span class="constructor__switch-thumb" />
              </span>
              <span class="constructor__switch-text">
                <span class="constructor__switch-title">Публичная задача</span>
              </span>
            </label>
          </div>
        </div>

        <aside class="constructor__side">
          <section
            class="constructor__readiness"
            :class="{
              'constructor__readiness--ready': isReady,
              'constructor__readiness--ping': pinged === 'ring',
            }"
            aria-labelledby="constructor-readiness-title"
          >
            <div class="constructor__readiness-head">
              <div class="constructor__ring">
                <svg viewBox="0 0 84 84" aria-hidden="true">
                  <circle class="constructor__ring-track" cx="42" cy="42" :r="RING_RADIUS" />
                  <circle
                    class="constructor__ring-bar"
                    cx="42"
                    cy="42"
                    :r="RING_RADIUS"
                    :stroke-dasharray="ringDash"
                    :stroke-dashoffset="ringShift"
                  />
                </svg>
                <span :key="share.percent" class="constructor__ring-value">
                  {{ share.percent }}%
                </span>
              </div>
              <div>
                <h2 id="constructor-readiness-title" class="constructor__readiness-title">
                  Готовность задачи
                </h2>
                <span class="constructor__readiness-mood">{{ readinessMood(share) }}</span>
              </div>
            </div>
            <ul class="constructor__readiness-list">
              <li v-for="item in readiness" :key="item.text">
                <button
                  type="button"
                  class="constructor__readiness-item"
                  :class="{ 'constructor__readiness-item--done': item.isDone }"
                  @click="openTarget(item.target)"
                >
                  <svg
                    v-if="item.isDone"
                    class="constructor__readiness-icon"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M3 8.5 L6.5 12 L13 4.5" pathLength="1" />
                  </svg>
                  <svg
                    v-else
                    class="constructor__readiness-icon"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="5.5" />
                  </svg>
                  <span>{{ item.text }}</span>
                </button>
              </li>
            </ul>
            <p class="constructor__readiness-summary">
              {{ readinessSummary }}
            </p>
          </section>

          <section class="constructor__card-preview" aria-labelledby="constructor-card-title">
            <h2 id="constructor-card-title" class="constructor__side-title">Карточка в каталоге</h2>
            <article class="constructor__card" :class="cardClass">
              <span class="constructor__card-chip">
                {{ draft.category.trim() === "" ? "Без категории" : draft.category }}
              </span>
              <h3 class="constructor__card-name">{{ pageTitle }}</h3>
              <p class="constructor__card-text">{{ cardText }}</p>
              <GraphMiniature
                v-if="cardGraph !== null"
                class="constructor__card-graph"
                :graph="cardGraph"
              />
            </article>
          </section>
        </aside>
      </div>
    </section>

    <section
      v-else-if="activeTab === 'graph'"
      id="constructor-panel-graph"
      class="constructor__panel constructor__panel--graph"
      role="tabpanel"
      aria-labelledby="constructor-tab-graph"
    >
      <div class="constructor__rules">
        <GraphRulesForm
          v-model="draft.rules"
          :show-direction="false"
          title="В своём ответе студент может:"
        />
        <p class="constructor__rules-hint">
          Этот граф студент увидит в условии без изменений, а свой ответ начнёт с его копии. Галочки
          задают, что можно делать с копией.
        </p>
        <button
          type="button"
          class="constructor__templates-toggle"
          :aria-expanded="templatesOpen"
          @click="templatesOpen = !templatesOpen"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
          Шаблоны
        </button>
      </div>
      <Transition name="constructor-drawer">
        <div
          v-if="templatesOpen"
          class="constructor__templates"
          role="group"
          aria-label="Шаблоны графов"
        >
          <button
            v-for="(template, index) in GRAPH_TEMPLATES"
            :key="template.id"
            type="button"
            class="constructor__template"
            :style="{ '--index': String(index) }"
            :title="'Вставить: ' + template.title"
            @click="insertTemplate(template.id)"
          >
            <GraphMiniature
              class="constructor__template-picture"
              :graph="templateGraphs.get(template.id) ?? null"
            />
            <span class="constructor__template-title">{{ template.title }}</span>
            <span class="constructor__template-note">{{ template.note }}</span>
          </button>
        </div>
      </Transition>
      <GraphEditor ref="editor" v-model:graph="draft.graph" class="constructor__editor" analysis />
    </section>

    <section
      v-else-if="activeTab === 'student'"
      id="constructor-panel-student"
      class="constructor__panel constructor__panel--student"
      role="tabpanel"
      aria-labelledby="constructor-tab-student"
    >
      <div class="constructor__trial-bar">
        <span class="constructor__trial-title">Так задачу увидит студент.</span>
        <span>Решайте как студент: правила работают по-настоящему, а черновик не меняется.</span>
        <UiButton size="sm" class="constructor__trial-restart" @click="restartTrial">
          Начать заново
        </UiButton>
      </div>
      <div class="constructor__trial">
        <TaskCondition class="constructor__task" :view="previewView" :hints="trialHints">
          <template #top>
            <span class="constructor__draft-badge">Черновик</span>
          </template>
          <template v-if="draft.hasGraph && draft.graph.vertices.length === 0" #bottom>
            <p class="constructor__hint">Граф пока пустой: нарисуйте его на вкладке «Граф».</p>
          </template>
        </TaskCondition>
        <section class="constructor__answer" aria-labelledby="constructor-answer-title">
          <div class="constructor__answer-bar">
            <h2 id="constructor-answer-title" class="constructor__answer-title">Ваш ответ</h2>
            <UiCheckbox
              v-if="canPickTrialDirection"
              :model-value="trialGraph.isDirected"
              label="Ориентированный граф"
              @update:model-value="onTrialDirectedChange"
            />
            <UiButton
              variant="primary"
              size="sm"
              class="constructor__check"
              disabled
              title="Проверка появится вместе с сохранением задачи"
            >
              Проверить решение
            </UiButton>
          </div>
          <GraphEditor
            :key="trialKey"
            v-model:graph="trialGraph"
            :rules="trialRules"
            class="constructor__editor"
          />
        </section>
      </div>
    </section>

    <section
      v-else
      id="constructor-panel-conditions"
      class="constructor__panel constructor__panel--form"
      role="tabpanel"
      aria-labelledby="constructor-tab-conditions"
    >
      <div class="constructor__conditions">
        <div class="constructor__catalog">
          <h2 class="constructor__side-title">Каталог проверок</h2>
          <div v-if="loadingPlugins" class="constructor__skeletons">
            <p class="constructor__hint" role="status">Загружаем плагины…</p>
            <span v-for="index in 4" :key="index" class="constructor__skeleton" />
          </div>
          <div v-else-if="pluginsError" class="constructor__catalog-error">
            <p role="alert">Не удалось загрузить каталог: {{ pluginsError.message }}</p>
            <UiButton size="sm" @click="retry">Повторить</UiButton>
          </div>
          <PluginPicker
            v-else
            :plugins="plugins"
            :graph-type="graphType"
            :used="conditionUsage"
            @pick="addPlugin"
          />
        </div>
        <div ref="checklist" class="constructor__checklist">
          <h2 class="constructor__side-title">Проверки задачи</h2>
          <p class="constructor__hint">
            Проверки идут по порядку. Студент видит только их названия, а текст ошибки — когда
            проверка не пройдёт.
          </p>
          <ul v-if="incompatibleConditions.length > 0" class="constructor__condition-warnings">
            <li v-for="number in incompatibleConditions" :key="number">
              Проверка {{ number }} не подходит для такого вида графа
            </li>
          </ul>
          <TaskConditionsEditor v-model="draft.conditions" />
        </div>
      </div>
    </section>

    <Transition name="constructor-toast">
      <div v-if="toast !== null" :key="toast.key" class="constructor__toast" role="status">
        <span>{{ toast.text }}</span>
        <button
          v-if="toast.actionText !== ''"
          type="button"
          class="constructor__toast-action"
          @click="runToastAction"
        >
          {{ toast.actionText }}
        </button>
        <button
          type="button"
          class="constructor__toast-close"
          aria-label="Скрыть"
          @click="toast = null"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4 L12 12 M12 4 L4 12" />
          </svg>
        </button>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.constructor {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.constructor__header,
.constructor__created,
.constructor__notice,
.constructor__panel {
  position: relative;
  z-index: 1;
}

.constructor__header {
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
}

.constructor__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: var(--space-2) 0;
}

.constructor__title {
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-lg);
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: constructor-ink 600ms var(--ease-out) backwards;
}

.constructor__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.constructor__save-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  animation: constructor-save 900ms var(--ease-out);
}

.constructor__save-dot--off {
  background: var(--color-danger);
  animation: none;
}

.constructor__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.constructor__confirm {
  font-size: var(--font-size-md);
  white-space: nowrap;
  animation: constructor-rise 260ms var(--ease-out) backwards;
}

.constructor__save--ready {
  animation: constructor-ready 2.4s ease-in-out 3;
}

.constructor__tabs {
  position: relative;
  display: flex;
  align-self: stretch;
  gap: var(--space-1);
}

.constructor__tab-slider {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--color-accent);
  transition:
    transform 360ms var(--ease-spring),
    width 360ms var(--ease-spring);
}

.constructor__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-3);
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-md);
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.constructor__tab:hover {
  color: var(--color-text);
}

.constructor__tab--active {
  color: var(--color-text);
  font-weight: 600;
}

.constructor__tab:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.constructor__tab-icon {
  flex: none;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.constructor__tab-icon--done {
  stroke: var(--color-success);
  stroke-width: 1.8;
  animation: constructor-pop 420ms var(--ease-spring) backwards;
}

.constructor__notice {
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-md);
  animation: constructor-drop 320ms var(--ease-out) backwards;
}

.constructor__notice--error {
  background: var(--graph-red-fill);
}

.constructor__notice-list {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-5);
}

.constructor__created {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--graph-green-fill);
  animation: constructor-drop 420ms var(--ease-spring) backwards;
}

.constructor__created-mark {
  flex: none;
  width: 56px;
  height: 42px;
}

.constructor__created-path {
  fill: none;
  stroke: var(--color-success);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  animation: constructor-draw 700ms var(--ease-out) 200ms backwards;
}

.constructor__created-vertex {
  fill: var(--color-surface);
  stroke: var(--color-success);
  stroke-width: 3;
  transform-box: fill-box;
  transform-origin: center;
  animation: constructor-pop 420ms var(--ease-spring) backwards;
}

.constructor__created-vertex:nth-of-type(2) {
  animation-delay: 360ms;
}

.constructor__created-vertex:nth-of-type(3) {
  animation-delay: 720ms;
}

.constructor__created-text {
  display: grid;
  gap: 2px;
  font-size: var(--font-size-md);
}

.constructor__created-link {
  margin-left: auto;
  padding: var(--space-2) var(--space-4);
  border-radius: 999px;
  background: var(--color-success);
  color: var(--color-on-accent);
  font-weight: 600;
  text-decoration: none;
  transition: transform var(--duration) var(--ease-spring);
}

.constructor__created-link:hover {
  transform: translateY(-1px);
}

.constructor__created-close,
.constructor__toast-close {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.constructor__created-close:hover,
.constructor__toast-close:hover {
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.constructor__created-close svg,
.constructor__toast-close svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.constructor__panel {
  flex: 1;
  min-height: 0;
}

.constructor__panel--form {
  overflow-y: auto;
  padding: var(--space-6) var(--space-4);
}

.constructor__panel--graph,
.constructor__panel--student {
  display: flex;
  flex-direction: column;
  background: var(--color-page);
}

.constructor__columns {
  display: grid;
  grid-template-columns: minmax(0, 680px) minmax(260px, 320px);
  justify-content: center;
  align-items: start;
  gap: var(--space-6);
}

.constructor__sheet {
  position: relative;
  display: grid;
  gap: var(--space-5);
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: constructor-rise 480ms var(--ease-out) backwards;
}

.constructor__sheet::before,
.constructor__sheet::after {
  position: absolute;
  width: 18px;
  height: 18px;
  border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  border-style: solid;
  content: "";
  pointer-events: none;
}

.constructor__sheet::before {
  top: 10px;
  left: 10px;
  border-width: 1.5px 0 0 1.5px;
}

.constructor__sheet::after {
  right: 10px;
  bottom: 10px;
  border-width: 0 1.5px 1.5px 0;
}

.constructor__field {
  border-radius: var(--radius-md);
}

.constructor__field--ping {
  animation: constructor-ping 1.2s var(--ease-out);
}

.constructor__ideas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-2);
}

.constructor__idea {
  min-height: 26px;
  padding: 0 var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
  animation: constructor-rise 320ms var(--ease-out) calc(var(--index) * 40ms) backwards;
}

.constructor__idea:hover {
  border-color: var(--color-accent);
  border-style: solid;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.constructor__idea:focus-visible,
.constructor__templates-toggle:focus-visible,
.constructor__template:focus-visible,
.constructor__readiness-item:focus-visible,
.constructor__toast-action:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.constructor__idea--start {
  font-style: italic;
}

.constructor__kinds {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.constructor__kinds-title {
  margin-bottom: var(--space-2);
  padding: 0;
  font-size: var(--font-size-md);
  font-weight: 500;
}

.constructor__kind-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.constructor__kind {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-width: 132px;
  padding: var(--space-3) var(--space-4) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration) var(--ease-spring);
}

.constructor__kind:hover {
  border-color: color-mix(in srgb, var(--color-accent) 50%, var(--color-border));
  color: var(--color-text);
  transform: translateY(-1px);
}

.constructor__kind--active {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font-weight: 600;
}

.constructor__kind:focus-within {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.constructor__kind-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.constructor__kind-picture {
  width: 48px;
  height: 28px;
  fill: var(--color-surface);
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.constructor__kind--active .constructor__kind-picture {
  animation: constructor-pop 420ms var(--ease-spring);
}

.constructor__switches {
  display: grid;
  gap: var(--space-3);
}

.constructor__switch {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  cursor: pointer;
}

.constructor__switch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.constructor__switch-track {
  position: relative;
  flex: none;
  width: 38px;
  height: 22px;
  margin-top: 1px;
  border-radius: 999px;
  background: var(--color-border);
  transition: background var(--duration) var(--ease-out);
}

.constructor__switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface);
  box-shadow: 0 1px 3px rgb(13 23 48 / 25%);
  transition: transform 320ms var(--ease-spring);
}

.constructor__switch-input:checked + .constructor__switch-track {
  background: var(--color-accent);
}

.constructor__switch-input:checked + .constructor__switch-track .constructor__switch-thumb {
  transform: translateX(16px);
}

.constructor__switch-input:focus-visible + .constructor__switch-track {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.constructor__switch-text {
  display: grid;
  gap: 2px;
}

.constructor__switch-title {
  font-size: var(--font-size-md);
  font-weight: 500;
}

.constructor__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__side {
  position: sticky;
  top: 0;
  display: grid;
  gap: var(--space-4);
  animation: constructor-rise 480ms var(--ease-out) 120ms backwards;
}

.constructor__readiness {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition: border-color var(--duration) var(--ease-out);
}

.constructor__readiness--ready {
  border-color: color-mix(in srgb, var(--color-success) 55%, var(--color-border));
  animation: constructor-glow 1.2s var(--ease-out);
}

.constructor__readiness--ping {
  animation: constructor-shake 520ms var(--ease-out);
}

.constructor__readiness-head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.constructor__ring {
  position: relative;
  flex: none;
  width: 76px;
  height: 76px;
}

.constructor__ring svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.constructor__ring-track,
.constructor__ring-bar {
  fill: none;
  stroke-width: 8;
}

.constructor__ring-track {
  stroke: var(--color-surface-hover);
}

.constructor__ring-bar {
  stroke: var(--color-accent);
  stroke-linecap: round;
  transition:
    stroke-dashoffset 800ms var(--ease-out),
    stroke 400ms var(--ease-out);
}

.constructor__readiness--ready .constructor__ring-bar {
  stroke: var(--color-success);
}

.constructor__ring-value {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: var(--font-size-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  animation: constructor-pop 360ms var(--ease-spring) backwards;
}

.constructor__readiness-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.constructor__readiness-mood {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__readiness--ready .constructor__readiness-mood {
  color: var(--color-success);
  font-weight: 600;
}

.constructor__readiness-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.constructor__readiness-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
  padding: 6px var(--space-2);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-md);
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.constructor__readiness-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.constructor__readiness-item--done {
  color: var(--color-text);
}

.constructor__readiness-icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 1.5;
}

.constructor__readiness-item--done .constructor__readiness-icon {
  stroke: var(--graph-green-stroke);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  animation: constructor-draw 420ms var(--ease-out) backwards;
}

.constructor__readiness-summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__side-title {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.constructor__card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--cat);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition:
    border-color var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out),
    box-shadow var(--duration) var(--ease-out);
}

.constructor__card:hover {
  box-shadow: var(--shadow-popover);
  transform: translateY(-2px);
}

.constructor__card-chip {
  justify-self: start;
  padding: 2px var(--space-2);
  border-radius: 999px;
  background: color-mix(in srgb, var(--cat) 16%, transparent);
  color: var(--cat);
  font-size: 12px;
  font-weight: 600;
}

.constructor__card-name {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: var(--font-size-lg);
}

.constructor__card-text {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.constructor__card-graph {
  justify-self: end;
}

.constructor-cat-0 {
  --cat: var(--color-accent);
}

.constructor-cat-1 {
  --cat: var(--graph-active);
}

.constructor-cat-2 {
  --cat: var(--color-success);
}

.constructor-cat-3 {
  --cat: var(--color-danger);
}

.constructor-cat-4 {
  --cat: color-mix(in oklch, var(--color-accent), var(--color-danger));
}

.constructor-cat-5 {
  --cat: color-mix(in oklch, var(--graph-active), var(--color-success));
}

.constructor__rules {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-5);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

.constructor__rules-hint {
  flex: 1 1 280px;
  max-width: 420px;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.constructor__templates-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  margin-left: auto;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}

.constructor__templates-toggle[aria-expanded="true"] {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.constructor__templates-toggle svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}

.constructor__templates {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

.constructor__template {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 128px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-spring);
  animation: constructor-rise 320ms var(--ease-out) calc(var(--index) * 35ms) backwards;
}

.constructor__template:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-popover);
  transform: translateY(-2px);
}

.constructor__template:active {
  transform: scale(0.97);
}

.constructor__template-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.constructor__template-note {
  color: var(--color-text-muted);
  font-size: 12px;
}

.constructor-drawer-enter-active,
.constructor-drawer-leave-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform var(--duration) var(--ease-out);
}

.constructor-drawer-enter-from,
.constructor-drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.constructor__trial-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-accent-muted);
  font-size: var(--font-size-md);
}

.constructor__trial-title {
  font-weight: 600;
}

.constructor__trial-restart {
  margin-left: auto;
}

.constructor__trial {
  flex: 1;
  min-height: 0;
  display: flex;
}

.constructor__draft-badge {
  display: inline-block;
  padding: 2px var(--space-2);
  border: 1px dashed var(--graph-active);
  border-radius: 999px;
  color: var(--graph-active);
  font-size: 12px;
  font-weight: 600;
}

.constructor__answer {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.constructor__answer-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.constructor__answer-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.constructor__check {
  margin-left: auto;
}

.constructor__editor {
  flex: 1;
  min-height: 0;
}

.constructor__conditions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  align-items: start;
  gap: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.constructor__catalog {
  position: sticky;
  top: 0;
  max-height: calc(100vh - var(--header-height) - 140px);
  padding: var(--space-4);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  animation: constructor-rise 420ms var(--ease-out) backwards;
}

.constructor__checklist {
  display: grid;
  gap: var(--space-3);
  animation: constructor-rise 420ms var(--ease-out) 100ms backwards;
}

.constructor__checklist .constructor__side-title {
  margin: 0;
}

.constructor__skeletons {
  display: grid;
  gap: var(--space-2);
}

.constructor__skeleton {
  height: 60px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--color-surface-hover) 25%,
    var(--color-border) 50%,
    var(--color-surface-hover) 75%
  );
  background-size: 200% 100%;
  animation: constructor-shimmer 1.2s linear infinite;
}

.constructor__catalog-error {
  display: grid;
  justify-items: start;
  gap: var(--space-2);
}

.constructor__catalog-error p {
  margin: 0;
}

.constructor__condition-warnings {
  margin: 0;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--graph-red-fill);
  animation: constructor-drop 320ms var(--ease-out) backwards;
}

.constructor__toast {
  position: fixed;
  bottom: var(--space-5);
  left: 50%;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: min(560px, calc(100vw - 32px));
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-text);
  color: var(--color-surface);
  box-shadow: var(--shadow-popover);
  font-size: var(--font-size-md);
  transform: translateX(-50%);
}

.constructor__toast-action {
  flex: none;
  padding: var(--space-1) var(--space-3);
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 18%, transparent);
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.constructor-toast-enter-active {
  transition:
    opacity var(--duration) var(--ease-out),
    transform 360ms var(--ease-spring);
}

.constructor-toast-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.constructor-toast-enter-from,
.constructor-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}

@keyframes constructor-ink {
  from {
    color: var(--color-accent);
  }
}

@keyframes constructor-save {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-success) 60%, transparent);
  }
  100% {
    box-shadow: 0 0 0 7px transparent;
  }
}

@keyframes constructor-ready {
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-accent) 25%, transparent);
  }
}

@keyframes constructor-pop {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}

@keyframes constructor-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes constructor-drop {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes constructor-draw {
  from {
    stroke-dashoffset: 1;
  }
}

@keyframes constructor-ping {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 45%, transparent);
  }
  100% {
    box-shadow: 0 0 0 10px transparent;
  }
}

@keyframes constructor-glow {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-success) 45%, transparent);
  }
  100% {
    box-shadow: 0 0 0 14px transparent;
  }
}

@keyframes constructor-shake {
  20%,
  60% {
    transform: translateX(-5px);
  }
  40%,
  80% {
    transform: translateX(5px);
  }
}

@keyframes constructor-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 960px) {
  .constructor__columns,
  .constructor__conditions {
    grid-template-columns: minmax(0, 1fr);
  }

  .constructor__side,
  .constructor__catalog {
    position: static;
    max-height: none;
  }

  .constructor__header {
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
  }

  .constructor__tabs {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }
}
</style>
