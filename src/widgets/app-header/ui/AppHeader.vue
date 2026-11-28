<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { MotionToggle } from "@/features/motion-switch";
import { ThemeToggle } from "@/features/theme-switch";
import { userInitials } from "@/entities/user";
import { UiButton } from "@/shared/ui";
import { isSectionActive, visibleSections } from "../lib/sections";
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
    event.stopPropagation();
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
  window.addEventListener("keydown", onWindowKeyDown, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onWindowPointerDown);
  window.removeEventListener("keydown", onWindowKeyDown, true);
});
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-header__logo">
      <svg class="app-header__logo-icon" viewBox="0 0 28 28" aria-hidden="true">
        <path class="app-header__logo-edges" d="M14 6 L6 22 L22 22 Z" />
        <circle class="app-header__logo-vertex app-header__logo-vertex--top" cx="14" cy="6" r="4" />
        <circle
          class="app-header__logo-vertex app-header__logo-vertex--left"
          cx="6"
          cy="22"
          r="4"
        />
        <circle
          class="app-header__logo-vertex app-header__logo-vertex--right"
          cx="22"
          cy="22"
          r="4"
        />
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

    <div class="app-header__toggles">
      <MotionToggle />
      <ThemeToggle />
    </div>

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
  position: relative;
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-4);
  height: var(--header-height);
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  transition:
    background-color var(--duration) var(--ease-out),
    border-color var(--duration) var(--ease-out);
}

.app-header__logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-2);
  margin-right: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-xl);
  font-weight: 800;
  letter-spacing: -0.4px;
  text-decoration: none;
}

.app-header__logo:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 4px;
}

.app-header__logo-icon {
  width: 28px;
  height: 28px;
  overflow: visible;
}

.app-header__logo-edges {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2.2;
  stroke-linejoin: round;
  stroke-dasharray: 60;
  stroke-dashoffset: 0;
}

.app-header__logo-vertex {
  transform-box: fill-box;
  transform-origin: center;
}

.app-header__logo-vertex--top {
  fill: var(--color-accent);
}

.app-header__logo-vertex--left {
  fill: var(--graph-green-stroke);
}

.app-header__logo-vertex--right {
  fill: var(--graph-red-stroke);
}

.app-header__logo:hover .app-header__logo-edges {
  animation: app-header-draw 700ms var(--ease-out);
}

.app-header__logo:hover .app-header__logo-vertex {
  animation: app-header-pop 520ms var(--ease-spring) both;
}

.app-header__logo:hover .app-header__logo-vertex--left {
  animation-delay: 90ms;
}

.app-header__logo:hover .app-header__logo-vertex--right {
  animation-delay: 180ms;
}

@keyframes app-header-draw {
  from {
    stroke-dashoffset: 60;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes app-header-pop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.45);
  }
  100% {
    transform: scale(1);
  }
}

/* На узком экране разделы прокручиваются вбок и не налезают друг на друга */
.app-header__toggles {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-2);
}

.app-header__nav {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
  margin-right: auto;
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  overflow-x: auto;
}

.app-header__link {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: var(--control-height-sm);
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.app-header__link:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.app-header__link:active {
  transform: scale(0.96);
}

.app-header__link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.app-header__link--active,
.app-header__link--active:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 700;
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
  border-radius: var(--radius-md);
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 800;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.app-header__avatar:hover {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.app-header__avatar:active {
  transform: scale(0.94);
}

.app-header__avatar:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Телефон: в одну строку разделы сжимались в узкую полоску. Делим шапку на две строки:
   сверху логотип, переключатели и аватар, снизу разделы на всю ширину с прокруткой вбок.
   Высоту шапки меняем и в общей переменной — по ней отступают фоны страниц и полоска загрузки. */
@media (max-width: 720px) {
  :global(:root) {
    --header-height: 108px;
  }

  .app-header {
    flex-wrap: wrap;
    align-content: center;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-2) var(--space-4);
  }

  .app-header__logo {
    margin-right: auto;
  }

  .app-header__nav {
    flex-basis: 100%;
    order: 1;
    margin-right: 0;
    scrollbar-width: none;
  }

  .app-header__nav::-webkit-scrollbar {
    display: none;
  }
}
</style>
