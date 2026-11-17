<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { roleTitle } from "../lib/sections";
import type { HeaderUser } from "../lib/sections";

const props = defineProps<{ user: HeaderUser }>();
const emit = defineEmits<{ close: []; signOut: [] }>();

const fullName = computed(() => (props.user.firstName + " " + props.user.lastName).trim());
</script>

<template>
  <div class="user-menu">
    <div class="user-menu__info">
      <div class="user-menu__name">{{ fullName === "" ? user.email : fullName }}</div>
      <div v-if="fullName !== ''" class="user-menu__email">{{ user.email }}</div>
      <div class="user-menu__role">{{ roleTitle(user.role) }}</div>
    </div>

    <RouterLink to="/profile" class="user-menu__item" @click="emit('close')">Профиль</RouterLink>
    <button type="button" class="user-menu__item user-menu__item--danger" @click="emit('signOut')">
      Выйти
    </button>
  </div>
</template>

<style scoped>
.user-menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  z-index: 10;
  min-width: 15rem;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.user-menu__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.user-menu__name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.user-menu__email,
.user-menu__role {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

.user-menu__item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.user-menu__item:hover {
  background: var(--color-surface-hover);
}

.user-menu__item:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.user-menu__item--danger {
  color: var(--color-danger);
}
</style>
