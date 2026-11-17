<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { GraphColor } from "@/entities/graph";
import { MENU_WIDTH, type MenuAction, type MenuItem } from "../lib/contextMenu";
import GraphColorSwatches from "./GraphColorSwatches.vue";

defineProps<{
  left: number;
  top: number;
  items: MenuItem[];
  submenuOnLeft: boolean;
  showColors: boolean;
  currentColor: GraphColor | null;
}>();

const emit = defineEmits<{
  choose: [action: MenuAction];
  color: [color: GraphColor];
  close: [];
}>();

const menuElement = ref<HTMLElement | null>(null);
const openSubmenu = ref<MenuAction | null>(null);

function toggleSubmenu(action: MenuAction) {
  openSubmenu.value = openSubmenu.value === action ? null : action;
}

function onWindowPointerDown(event: PointerEvent) {
  const target = event.target;
  if (menuElement.value !== null && target instanceof Node && menuElement.value.contains(target)) {
    return;
  }
  emit("close");
}

function onWindowKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.stopPropagation();
    emit("close");
  }
}

onMounted(() => {
  window.addEventListener("pointerdown", onWindowPointerDown, true);
  window.addEventListener("keydown", onWindowKeyDown, true);
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
  window.removeEventListener("keydown", onWindowKeyDown, true);
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
      v-if="showColors"
      class="graph-menu__colors"
      small
      :model-value="currentColor"
      @update:model-value="emit('color', $event)"
    />
    <template v-for="item in items" :key="item.action">
      <div
        v-if="item.submenu.length > 0"
        class="graph-menu__group"
        @mouseenter="openSubmenu = item.action"
      >
        <button
          type="button"
          role="menuitem"
          aria-haspopup="menu"
          :aria-expanded="openSubmenu === item.action"
          class="graph-menu__item graph-menu__item--parent"
          @click="toggleSubmenu(item.action)"
        >
          {{ item.label }}
          <span class="graph-menu__arrow" aria-hidden="true">›</span>
        </button>
        <div
          v-if="openSubmenu === item.action"
          class="graph-menu graph-menu__submenu"
          :class="{ 'graph-menu__submenu--left': submenuOnLeft }"
          role="menu"
          :style="{ width: MENU_WIDTH + 'px' }"
        >
          <button
            v-for="child in item.submenu"
            :key="child.action"
            type="button"
            role="menuitem"
            class="graph-menu__item"
            @click="emit('choose', child.action)"
          >
            {{ child.label }}
          </button>
        </div>
      </div>
      <button
        v-else
        type="button"
        role="menuitem"
        class="graph-menu__item"
        :class="{ 'graph-menu__item--danger': item.danger }"
        @mouseenter="openSubmenu = null"
        @click="emit('choose', item.action)"
      >
        {{ item.label }}
      </button>
    </template>
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

.graph-menu__group {
  position: relative;
  display: flex;
  flex-direction: column;
}

.graph-menu__item--parent {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.graph-menu__group:hover > .graph-menu__item--parent {
  background: var(--color-surface-hover);
}

.graph-menu__arrow {
  color: var(--color-text-muted);
}

.graph-menu__submenu {
  top: calc(-1 * var(--space-1) - 1px);
  left: calc(100% + var(--space-1));
}

.graph-menu__submenu--left {
  right: calc(100% + var(--space-1));
  left: auto;
}

.graph-menu__item--danger {
  color: var(--color-danger);
}

.graph-menu__item:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}
</style>
