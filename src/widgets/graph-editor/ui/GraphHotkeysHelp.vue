<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { filterHelp, hotkeyHelp } from "../lib/hotkeyHelp";
import { DEFAULT_HOTKEYS } from "../lib/hotkeys";

const emit = defineEmits<{
  close: [];
}>();

const allSections = hotkeyHelp(DEFAULT_HOTKEYS);
const query = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

const sections = computed(() => filterHelp(allSections, query.value));

onMounted(() => {
  if (searchInput.value !== null) {
    searchInput.value.focus({ preventScroll: true });
  }
});
</script>

<template>
  <div class="graph-help" @click.self="emit('close')">
    <section
      class="graph-help__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="graph-help-title"
    >
      <header class="graph-help__header">
        <h2 id="graph-help-title" class="graph-help__title">Горячие клавиши</h2>
        <input
          ref="searchInput"
          v-model="query"
          class="graph-help__search"
          type="search"
          placeholder="Найти действие или клавишу"
          aria-label="Найти действие или клавишу"
          @keydown.esc="emit('close')"
        />
        <button
          type="button"
          class="graph-help__close"
          title="Закрыть (Esc)"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4 L12 12 M12 4 L4 12" />
          </svg>
        </button>
      </header>
      <div class="graph-help__body">
        <p v-if="sections.length === 0" class="graph-help__nothing">
          Ничего не нашлось. Попробуйте другое слово, например «вершина» или «Ctrl».
        </p>
        <div v-else class="graph-help__sections">
          <div v-for="section in sections" :key="section.title" class="graph-help__section">
            <h3 class="graph-help__section-title">{{ section.title }}</h3>
            <dl class="graph-help__rows">
              <div v-for="row in section.rows" :key="row.title" class="graph-help__row">
                <dt class="graph-help__name">{{ row.title }}</dt>
                <dd class="graph-help__keys">
                  <kbd v-for="text in row.keys" :key="text" class="graph-help__key">
                    {{ text }}
                  </kbd>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.graph-help {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  background: rgb(6 12 28 / 45%);
  backdrop-filter: blur(3px);
  animation: graph-help-fade var(--duration) var(--ease-out);
}

.graph-help__dialog {
  display: flex;
  flex-direction: column;
  width: min(820px, 100%);
  max-height: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  animation: graph-help-in var(--duration) var(--ease-spring);
}

.graph-help__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.graph-help__title {
  margin: 0;
  font-size: var(--font-size-lg);
  white-space: nowrap;
}

.graph-help__search {
  flex: 1;
  min-width: 0;
  height: var(--control-height-sm);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-page);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-sm);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.graph-help__search:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

.graph-help__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--control-height-sm);
  height: var(--control-height-sm);
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.graph-help__close svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  transition: transform var(--duration) var(--ease-spring);
}

.graph-help__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.graph-help__close:hover svg {
  transform: rotate(90deg);
}

.graph-help__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-help__body {
  min-height: 0;
  padding: var(--space-4) var(--space-5) var(--space-5);
  overflow-y: auto;
}

.graph-help__nothing {
  margin: var(--space-5) 0;
  color: var(--color-text-muted);
  text-align: center;
}

.graph-help__sections {
  columns: 2 320px;
  column-gap: var(--space-4);
}

.graph-help__section {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-page);
  break-inside: avoid;
}

.graph-help__section-title {
  margin: 0 0 var(--space-2);
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.graph-help__rows {
  margin: 0;
}

.graph-help__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 5px 0;
}

.graph-help__row + .graph-help__row {
  border-top: 1px dashed var(--color-border);
}

.graph-help__name {
  font-size: var(--font-size-sm);
}

.graph-help__keys {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1);
  margin: 0;
}

.graph-help__key {
  min-width: 24px;
  padding: 2px 7px;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

@keyframes graph-help-fade {
  from {
    opacity: 0;
  }
}

@keyframes graph-help-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .graph-help,
  .graph-help__dialog {
    animation: none;
  }
}
</style>
