<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { UiButton } from "@/shared/ui";
import { isSectionActive, userInitials, visibleSections } from "../lib/sections";
import type { HeaderUser } from "../lib/sections";
import UserMenu from "./UserMenu.vue";

const props = defineProps<{ user: HeaderUser | null }>();
const emit = defineEmits<{ signOut: [] }>();

const route = useRoute();
const router = useRouter();

const isMenuOpen = ref(false);
const userArea = ref<HTMLElement | null>(null);
const avatarButton = ref<HTMLButtonElement | null>(null);

const sections = computed(() => visibleSections(props.user === null ? null : props.user.role));

const initials = computed(() => {
  if (props.user === null) {
    return "";
  }
  return userInitials(props.user.firstName, props.user.lastName, props.user.email);
});

function closeMenu() {
  isMenuOpen.value = false;
}

function onSignOut() {
  closeMenu();
  emit("signOut");
}

// Клик мимо аватара и меню закрывает меню. Клик по самому аватару сюда не попадает,
// иначе меню закрылось бы здесь и тут же открылось снова по click.
function onWindowPointerDown(event: PointerEvent) {
  if (!isMenuOpen.value || userArea.value === null) {
    return;
  }
  if (event.target instanceof Node && userArea.value.contains(event.target)) {
    return;
  }
  closeMenu();
}

function onWindowKeyDown(event: KeyboardEvent) {
  if (isMenuOpen.value && event.key === "Escape") {
    closeMenu();
    if (avatarButton.value !== null) {
      avatarButton.value.focus();
    }
  }
}

watch(
  () => props.user,
  (user) => {
    if (user === null) {
      closeMenu();
    }
  },
);

onMounted(() => {
  window.addEventListener("pointerdown", onWindowPointerDown);
  window.addEventListener("keydown", onWindowKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onWindowPointerDown);
  window.removeEventListener("keydown", onWindowKeyDown);
});
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-header__logo">
      <svg class="app-header__logo-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5 L5 19 L19 19 Z" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle cx="12" cy="5" r="3" fill="currentColor" />
        <circle cx="5" cy="19" r="3" fill="currentColor" />
        <circle cx="19" cy="19" r="3" fill="currentColor" />
      </svg>
      <span>WiseTask</span>
    </RouterLink>

    <nav class="app-header__nav" aria-label="Разделы сайта">
      <RouterLink
        v-for="section in sections"
        :key="section.to"
        :to="section.to"
        class="app-header__link"
        :class="{ 'app-header__link--active': isSectionActive(route.path, section.to) }"
      >
        {{ section.title }}
      </RouterLink>
    </nav>

    <div ref="userArea" class="app-header__user">
      <UiButton v-if="user === null" variant="primary" @click="router.push('/sign-in')">
        Войти
      </UiButton>

      <template v-else>
        <button
          ref="avatarButton"
          type="button"
          class="app-header__avatar"
          aria-haspopup="true"
          :aria-expanded="isMenuOpen"
          aria-label="Меню пользователя"
          @click="isMenuOpen = !isMenuOpen"
        >
          {{ initials }}
        </button>
        <UserMenu v-if="isMenuOpen" :user="user" @close="closeMenu" @sign-out="onSignOut" />
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-5);
  height: var(--header-height);
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-header__logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: 600;
  text-decoration: none;
}

.app-header__logo:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.app-header__logo-icon {
  width: 1.5em;
  height: 1.5em;
  color: var(--color-accent);
}

/* На узком экране разделы прокручиваются вбок и не налезают друг на друга */
.app-header__nav {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
  overflow-x: auto;
}

.app-header__link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: var(--control-height-md);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  white-space: nowrap;
}

.app-header__link:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.app-header__link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.app-header__link--active,
.app-header__link--active:hover {
  background: var(--color-accent-muted);
  color: var(--color-text);
  font-weight: 500;
}

.app-header__user {
  position: relative;
  flex-shrink: 0;
}

.app-header__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--control-height-md);
  height: var(--control-height-md);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.app-header__avatar:hover {
  background: var(--color-surface-hover);
}

.app-header__avatar:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
