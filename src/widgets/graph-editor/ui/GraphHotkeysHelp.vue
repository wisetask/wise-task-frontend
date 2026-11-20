<script setup lang="ts">
import { onMounted, ref } from "vue";
import { hotkeyHelp } from "../lib/hotkeyHelp";
import { DEFAULT_HOTKEYS } from "../lib/hotkeys";

const emit = defineEmits<{
  close: [];
}>();

const sections = hotkeyHelp(DEFAULT_HOTKEYS);
const closeButton = ref<HTMLButtonElement | null>(null);

onMounted(() => {
  if (closeButton.value !== null) {
    closeButton.value.focus();
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
        <button
          ref="closeButton"
          type="button"
          class="graph-help__close"
          title="Закрыть (Esc)"
          @click="emit('close')"
        >
          ×
        </button>
      </header>
      <div class="graph-help__sections">
        <div v-for="section in sections" :key="section.title" class="graph-help__section">
          <h3 class="graph-help__section-title">{{ section.title }}</h3>
          <dl class="graph-help__rows">
            <div v-for="row in section.rows" :key="row.title" class="graph-help__row">
              <dt class="graph-help__name">{{ row.title }}</dt>
              <dd class="graph-help__keys">
                <kbd v-for="text in row.keys" :key="text" class="graph-help__key">{{ text }}</kbd>
              </dd>
            </div>
          </dl>
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
  background: rgb(31 35 40 / 35%);
}

.graph-help__dialog {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.graph-help__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.graph-help__title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.graph-help__close {
  width: var(--control-height-sm);
  height: var(--control-height-sm);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-xl);
  line-height: 1;
  cursor: pointer;
}

.graph-help__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.graph-help__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.graph-help__sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4) var(--space-6);
  padding: var(--space-4);
  overflow-y: auto;
}

.graph-help__section-title {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.graph-help__rows {
  margin: 0;
}

.graph-help__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-1) 0;
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
  min-width: 22px;
  padding: 1px 6px;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  font-family: inherit;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
}
</style>
