<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { GraphColor } from "@/entities/graph";
import { MENU_WIDTH, type MenuAction, type MenuItem } from "../lib/contextMenu";
import GraphColorSwatches from "./GraphColorSwatches.vue";

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
    <GraphColorSwatches
      v-if="showColors && currentColor !== null"
      class="graph-menu__colors"
      small
      :model-value="currentColor"
      @update:model-value="emit('color', $event)"
    />
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
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-1);
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

.graph-menu__item:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}
</style>
