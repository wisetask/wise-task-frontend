<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import { nextMenuIndex, type UiMenuItem } from "./menu";
import UiButton from "./UiButton.vue";

withDefaults(
  defineProps<{
    label: string;
    items: UiMenuItem[];
    size?: "sm" | "md";
    disabled?: boolean;
  }>(),
  {
    size: "md",
    disabled: false,
  },
);

const emit = defineEmits<{
  select: [id: string];
}>();

const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);

function menuItems(): HTMLElement[] {
  if (root.value === null) {
    return [];
  }
  return Array.from(root.value.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

function focusItem(index: number) {
  const items = menuItems();
  if (index >= 0 && index < items.length) {
    items[index].focus();
  }
}

function focusTrigger() {
  if (root.value === null) {
    return;
  }
  const trigger = root.value.querySelector<HTMLElement>(".ui-menu-button__trigger");
  if (trigger !== null) {
    trigger.focus();
  }
}

function onOutsidePointer(event: PointerEvent) {
  if (root.value !== null && !root.value.contains(event.target as Node)) {
    close();
  }
}

async function open(focusIndex: number) {
  if (!isOpen.value) {
    isOpen.value = true;
    document.addEventListener("pointerdown", onOutsidePointer);
  }
  await nextTick();
  focusItem(focusIndex);
}

function close() {
  isOpen.value = false;
  document.removeEventListener("pointerdown", onOutsidePointer);
}

function toggle() {
  if (isOpen.value) {
    close();
  } else {
    open(-1);
  }
}

function choose(id: string) {
  close();
  focusTrigger();
  emit("select", id);
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    open(0);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    open(menuItems().length - 1);
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const items = menuItems();
  const current = items.indexOf(document.activeElement as HTMLElement);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    focusItem(nextMenuIndex(current, 1, items.length));
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    focusItem(nextMenuIndex(current, -1, items.length));
  } else if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close();
    focusTrigger();
  } else if (event.key === "Tab") {
    close();
  }
}

onBeforeUnmount(() => {
  close();
});
</script>

<template>
  <div ref="root" class="ui-menu-button">
    <UiButton
      class="ui-menu-button__trigger"
      :size="size"
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      {{ label }}
      <svg class="ui-menu-button__chevron" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3 4.5 L6 7.5 L9 4.5" />
      </svg>
    </UiButton>
    <div v-if="isOpen" class="ui-menu-button__menu" role="menu" @keydown="onMenuKeydown">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        role="menuitem"
        class="ui-menu-button__item"
        @click="choose(item.id)"
      >
        <span class="ui-menu-button__label">{{ item.label }}</span>
        <span v-if="item.hint" class="ui-menu-button__hint">{{ item.hint }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ui-menu-button {
  position: relative;
  display: inline-flex;
}

.ui-menu-button__chevron {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ui-menu-button__menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  z-index: 30;
  min-width: 14rem;
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.ui-menu-button__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ui-menu-button__item:hover {
  background: var(--color-surface-hover);
}

.ui-menu-button__item:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.ui-menu-button__label {
  font-size: var(--font-size-md);
}

.ui-menu-button__hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
