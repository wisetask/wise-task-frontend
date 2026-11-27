<script setup lang="ts">
import AuthScene from "./AuthScene.vue";

withDefaults(
  defineProps<{
    title: string;
    subtitle: string;
    progress?: number;
    state?: "idle" | "error" | "success";
  }>(),
  {
    progress: 0,
    state: "idle",
  },
);

interface Feature {
  text: string;
  icon: string;
}

const FEATURES: Feature[] = [
  { text: "Рисуете граф мышкой: вершины, рёбра, веса и цвета", icon: "draw" },
  { text: "Решение проверяется сразу, без ожидания преподавателя", icon: "check" },
  { text: "Обходы, Дейкстра и остов — по шагам, с пояснениями", icon: "steps" },
];
</script>

<template>
  <main class="auth-layout">
    <AuthScene class="auth-layout__scene" :progress="progress" :state="state" />

    <div class="auth-layout__content">
      <aside class="auth-layout__brand">
        <p class="auth-layout__logo">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 17 L12 6 L18 17 Z" />
            <circle cx="12" cy="6" r="2.6" />
            <circle cx="6" cy="17" r="2.6" />
            <circle cx="18" cy="17" r="2.6" />
          </svg>
          WiseTask
        </p>
        <p class="auth-layout__tagline">Задачи по теории графов прямо в браузере.</p>
        <ul class="auth-layout__features">
          <li v-for="feature in FEATURES" :key="feature.icon" class="auth-layout__feature">
            <span class="auth-layout__feature-icon" aria-hidden="true">
              <svg v-if="feature.icon === 'draw'" viewBox="0 0 24 24">
                <circle cx="6" cy="17" r="2.5" />
                <circle cx="17" cy="7" r="2.5" />
                <path d="M8 15.5 L15 8.5" />
              </svg>
              <svg v-else-if="feature.icon === 'check'" viewBox="0 0 24 24">
                <path d="M5 12.5 L10 17 L19 7" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path d="M5 19 H9 V14 H14 V9 H19 V5" />
              </svg>
            </span>
            {{ feature.text }}
          </li>
        </ul>
      </aside>

      <section class="auth-layout__card">
        <header class="auth-layout__header">
          <h1 class="auth-layout__title">{{ title }}</h1>
          <p class="auth-layout__subtitle">{{ subtitle }}</p>
        </header>
        <slot />
        <footer class="auth-layout__footer">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.auth-layout .auth-layout__scene {
  position: absolute;
  inset: 0;
}

.auth-layout__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  min-height: 100vh;
  padding: var(--space-6) clamp(24px, 7vw, 120px);
  pointer-events: none;
}

.auth-layout__brand,
.auth-layout__card {
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 78%, transparent);
  backdrop-filter: blur(14px);
  pointer-events: auto;
}

.auth-layout__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-self: flex-start;
  max-width: 400px;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  animation: auth-layout-rise 600ms var(--ease-out) both;
}

.auth-layout__logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 800;
}

.auth-layout__logo svg {
  width: 30px;
  height: 30px;
  fill: var(--color-accent);
  stroke: var(--color-accent);
  stroke-width: 1.6;
  stroke-linejoin: round;
}

.auth-layout__logo svg path {
  fill: var(--color-accent-muted);
}

.auth-layout__tagline {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.auth-layout__features {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.auth-layout__feature {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  animation: auth-layout-rise 500ms var(--ease-out) both;
}

.auth-layout__feature:nth-child(1) {
  animation-delay: 150ms;
}

.auth-layout__feature:nth-child(2) {
  animation-delay: 230ms;
}

.auth-layout__feature:nth-child(3) {
  animation-delay: 310ms;
}

.auth-layout__feature-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

.auth-layout__feature-icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.auth-layout__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 420px;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-popover);
  animation: auth-layout-card 600ms var(--ease-out) both;
}

.auth-layout__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.auth-layout__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.auth-layout__subtitle {
  margin: 0;
  color: var(--color-text-muted);
}

.auth-layout__card :deep(.auth-form > *) {
  animation: auth-layout-rise 480ms var(--ease-out) both;
}

.auth-layout__card :deep(.auth-form > *:nth-child(1)) {
  animation-delay: 120ms;
}

.auth-layout__card :deep(.auth-form > *:nth-child(2)) {
  animation-delay: 180ms;
}

.auth-layout__card :deep(.auth-form > *:nth-child(3)) {
  animation-delay: 240ms;
}

.auth-layout__card :deep(.auth-form > *:nth-child(4)) {
  animation-delay: 300ms;
}

.auth-layout__card :deep(.auth-form > *:nth-child(5)) {
  animation-delay: 360ms;
}

.auth-layout__card :deep(.auth-form > *:nth-child(n + 6)) {
  animation-delay: 420ms;
}

.auth-layout__footer {
  color: var(--color-text-muted);
}

.auth-layout__footer :deep(a) {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  background: linear-gradient(currentColor, currentColor) left bottom / 0 2px no-repeat;
  transition: background-size var(--duration) var(--ease-out);
}

.auth-layout__footer :deep(a:hover) {
  background-size: 100% 2px;
}

@keyframes auth-layout-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@keyframes auth-layout-card {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
}

@media (max-width: 900px) {
  .auth-layout__content {
    flex-direction: column;
    justify-content: center;
    padding: var(--space-5) var(--space-4);
  }

  .auth-layout__brand {
    align-self: stretch;
    max-width: none;
  }

  .auth-layout__features {
    display: none;
  }

  .auth-layout__card {
    max-width: none;
  }
}
</style>
