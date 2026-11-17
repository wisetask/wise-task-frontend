<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { GraphColor } from "@/entities/graph";
import { colorClass, GRAPH_COLORS } from "../lib/colors";
import { MENU_WIDTH, type MenuAction, type MenuItem } from "../lib/contextMenu";

defineProps<{
  left: number;
  top: number;
  items: MenuItem[];
  showColors: boolean;
  currentColor: GraphColor | null;
}>();

const emit = defineEmits<{
  choose: [action: MenuAction];
  color: [color: GraphColor];
  close: [];
}>();

const menuElement = ref<HTMLElement | null>(null);

function onWindowPointerDown(event: PointerEvent) {
  const target = event.target;
  if (menuElement.value !== null && target instanceof Node && menuElement.value.contains(target)) {
    return;
  }
  emit("close");
}

onMounted(() => {
  window.addEventListener("pointerdown", onWindowPointerDown, true);
  nextTick(() => {
    if (menuElement.value === null) {
      return;
    }
    const first = menuElement.value.querySelector("button");
    if (first !== null) {
      first.focus();
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onWindowPointerDown, true);
});
</script>

<template>
  <div
    ref="menuElement"
    class="graph-menu"
    role="menu"
    :style="{ left: left + 'px', top: top + 'px', width: MENU_WIDTH + 'px' }"
    @contextmenu.prevent
  >
    <div v-if="showColors" class="graph-menu__colors" role="group" aria-label="Цвет">
      <button
        v-for="option in GRAPH_COLORS"
        :key="option.value"
        type="button"
        role="menuitemradio"
        class="graph-menu__color"
        :class="[
          'graph-menu__color--' + colorClass(option.value),
          { 'graph-menu__color--active': currentColor === option.value },
        ]"
        :aria-checked="currentColor === option.value"
        :title="option.title"
        @click="emit('color', option.value)"
      >
        <span class="graph-menu__hidden">{{ option.title }}</span>
      </button>
    </div>
    <button
      v-for="item in items"
      :key="item.action"
      type="button"
      role="menuitem"
      class="graph-menu__item"
      :class="{ 'graph-menu__item--danger': item.danger }"
      @click="emit('choose', item.action)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.graph-menu {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.graph-menu__colors {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-1);
}

.graph-menu__color {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid var(--graph-vertex-stroke);
  border-radius: 50%;
  background: var(--graph-vertex-fill);
  cursor: pointer;
}

.graph-menu__color--red {
  border-color: var(--graph-red-stroke);
  background: var(--graph-red-fill);
}

.graph-menu__color--green {
  border-color: var(--graph-green-stroke);
  background: var(--graph-green-fill);
}

.graph-menu__color--blue {
  border-color: var(--graph-blue-stroke);
  background: var(--graph-blue-fill);
}

.graph-menu__color--active {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.graph-menu__item {
  height: 36px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.graph-menu__item:hover {
  background: var(--color-surface-hover);
}

.graph-menu__item--danger {
  color: var(--color-danger);
}

.graph-menu__item:focus-visible,
.graph-menu__color:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.graph-menu__hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
