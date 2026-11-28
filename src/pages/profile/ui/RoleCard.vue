<script setup lang="ts">
import { computed } from "vue";
import { roleTitle } from "@/entities/user";
import { roleAbilities, roleHint } from "../lib/roleAbilities";

const props = defineProps<{ role: string }>();

const abilities = computed(() => roleAbilities(props.role));
const hint = computed(() => roleHint(props.role));
</script>

<template>
  <div class="role-card">
    <ul class="role-card__list">
      <li
        v-for="(ability, index) in abilities"
        :key="ability.text"
        class="role-card__item"
        :class="{ 'role-card__item--locked': !ability.available }"
        :style="{ animationDelay: index * 60 + 'ms' }"
      >
        <span class="role-card__icon" aria-hidden="true">
          <svg v-if="ability.available" viewBox="0 0 16 16">
            <path d="M4 8.5 L7 11 L12 5" />
          </svg>
          <svg v-else viewBox="0 0 16 16">
            <rect x="4" y="7.5" width="8" height="6" rx="1.5" />
            <path d="M5.75 7.5 V5.75 a2.25 2.25 0 0 1 4.5 0 V7.5" />
          </svg>
        </span>
        <span class="role-card__text">
          {{ ability.text }}
          <span v-if="!ability.available" class="role-card__who">
            — доступно {{ ability.whoCan }}
          </span>
          <span v-if="!ability.available" class="visually-hidden">
            (у роли «{{ roleTitle(role) }}» этого нет)
          </span>
        </span>
      </li>
    </ul>
    <p v-if="hint" class="role-card__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.role-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.role-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.role-card__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-md);
  animation: role-card-rise 420ms var(--ease-out) backwards;
}

.role-card__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-success) 14%, transparent);
  color: var(--color-success);
}

.role-card__icon svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.role-card__item--locked {
  color: var(--color-text-muted);
}

.role-card__item--locked .role-card__icon {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.role-card__who {
  font-size: var(--font-size-sm);
}

.role-card__hint {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-accent-muted);
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes role-card-rise {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
}
</style>
