<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { fullName, roleTitle, userInitials, useUserStore } from "@/entities/user";
import { ChangePasswordForm } from "@/features/change-password";
import { DeleteAccountSection } from "@/features/delete-account";
import { motionAllowed } from "@/shared/lib/motion";
import { UiButton } from "@/shared/ui";
import { useActivity } from "../model/useActivity";
import ActivityCalendar from "./ActivityCalendar.vue";
import ProfileBackdrop from "./ProfileBackdrop.vue";
import ProfileWheel from "./ProfileWheel.vue";
import RoleCard from "./RoleCard.vue";

const userStore = useUserStore();
const router = useRouter();

const user = computed(() => userStore.user);
const activity = useActivity();
const activityDays = activity.days;

const name = computed(() => {
  const current = user.value;
  if (current === null) {
    return "";
  }
  return fullName(current.lastName, current.firstName, current.patronymic);
});

const initials = computed(() => {
  const current = user.value;
  if (current === null) {
    return "?";
  }
  return userInitials(current.firstName, current.lastName, current.email);
});

const SCROLL_TIME = 400;
const BREAK_TIME = 1100;
const breaking = ref(false);
const hero = ref<HTMLElement | null>(null);

function wait(time: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, time);
  });
}

async function signOut() {
  if (breaking.value) {
    return;
  }
  if (motionAllowed() && hero.value !== null) {
    hero.value.scrollIntoView({ behavior: "smooth", block: "center" });
    await wait(SCROLL_TIME);
    breaking.value = true;
    await wait(BREAK_TIME);
  }
  await userStore.logOut();
  router.push({ name: "sign-in" });
}

function onDeleted() {
  router.push("/");
}
</script>

<template>
  <div class="profile-page">
    <!-- Один корневой элемент: AppLayout оборачивает страницы в <Transition>, а он анимирует
         только элемент. Комментарий внутри: снаружи Vue тоже посчитал бы его вторым корнем. -->
    <ProfileBackdrop />
    <main v-if="user !== null" class="profile">
      <section ref="hero" class="profile__hero" aria-labelledby="profile-name">
        <ProfileWheel :first-name="user.firstName" :initials="initials" :breaking="breaking" />
        <div class="profile__who">
          <span class="profile__role">{{ roleTitle(user.role) }}</span>
          <h1 id="profile-name" class="profile__name">{{ name !== "" ? name : user.email }}</h1>
          <p class="profile__email">{{ user.email }}</p>
        </div>
      </section>

      <section class="profile__card" aria-labelledby="profile-activity">
        <header class="profile__card-head">
          <h2 id="profile-activity" class="profile__card-title">Активность</h2>
        </header>
        <ActivityCalendar :days="activityDays" :available="activity.available" />
      </section>

      <section class="profile__card" aria-labelledby="profile-role">
        <header class="profile__card-head">
          <h2 id="profile-role" class="profile__card-title">Что вам доступно</h2>
          <p class="profile__card-lead">
            Роль «{{ roleTitle(user.role) }}» открывает такие разделы.
          </p>
        </header>
        <RoleCard :role="user.role" />
      </section>

      <section class="profile__card" aria-labelledby="profile-password">
        <header class="profile__card-head">
          <h2 id="profile-password" class="profile__card-title">Пароль</h2>
          <p class="profile__card-lead">
            Новый пароль начнёт работать сразу, текущая сессия сохранится.
          </p>
        </header>
        <ChangePasswordForm />
      </section>

      <section class="profile__card profile__card--row" aria-labelledby="profile-sign-out">
        <header class="profile__card-head">
          <h2 id="profile-sign-out" class="profile__card-title">Выход</h2>
          <p class="profile__card-lead">Выйти из аккаунта на этом устройстве.</p>
        </header>
        <UiButton :loading="breaking" @click="signOut">Выйти</UiButton>
      </section>

      <section class="profile__card profile__card--danger" aria-labelledby="profile-delete">
        <header class="profile__card-head">
          <h2 id="profile-delete" class="profile__card-title">Удаление аккаунта</h2>
        </header>
        <DeleteAccountSection :email="user.email" @deleted="onDeleted" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  position: relative;
}

/* Над живым фоном (ProfileBackdrop лежит под страницей, z-index: 0) */
.profile {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.profile__hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(
      circle at 15% 50%,
      color-mix(in srgb, var(--color-accent) 18%, transparent),
      transparent 55%
    ),
    radial-gradient(
      circle at 95% 110%,
      color-mix(in srgb, var(--graph-active) 14%, transparent),
      transparent 50%
    ),
    var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: profile-rise 480ms var(--ease-out) backwards;
}

.profile__who {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
}

.profile__role {
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.profile__name {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.profile__email {
  margin: 0;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.profile__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  animation: profile-rise 480ms var(--ease-out) backwards;
}

.profile__card:nth-of-type(2) {
  animation-delay: 80ms;
}

.profile__card:nth-of-type(3) {
  animation-delay: 140ms;
}

.profile__card:nth-of-type(4) {
  animation-delay: 200ms;
}

.profile__card:nth-of-type(5) {
  animation-delay: 260ms;
}

.profile__card:nth-of-type(6) {
  animation-delay: 320ms;
}

.profile__card--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.profile__card--danger {
  border-color: color-mix(in srgb, var(--color-danger) 30%, var(--color-border));
}

.profile__card-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile__card-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 800;
}

.profile__card--danger .profile__card-title {
  color: var(--color-danger);
}

.profile__card-lead {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

@keyframes profile-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

@media (max-width: 640px) {
  .profile {
    padding: var(--space-5) var(--space-4);
  }

  .profile__hero {
    flex-direction: column;
    align-items: center;
    padding: var(--space-5) var(--space-4);
    text-align: center;
  }

  .profile__who {
    align-items: center;
  }

  .profile__name {
    font-size: 24px;
  }

  .profile__card {
    padding: var(--space-5) var(--space-4);
  }

  .profile__card--row {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile__hero,
  .profile__card {
    animation: none;
  }
}
</style>
