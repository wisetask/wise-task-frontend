import { createRouter, createWebHistory } from "vue-router";
import type { RouteMeta, RouteRecordRaw } from "vue-router";
import { checkAccess, useUserStore } from "@/entities/user";
import type { Role } from "@/shared/api";
import AppLayout from "./layouts/AppLayout.vue";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: Role[];
    // AppLayout не перезапускает анимацию перехода между страницами с одним именем маршрута
    samePage?: boolean;
  }
}

const SIGNED_IN: RouteMeta = { requiresAuth: true };
const AUTHORS: RouteMeta = { roles: ["AUTHOR", "ADMIN"] };
const ADMINS: RouteMeta = { roles: ["ADMIN"] };

// Разделы, которых пока нет: на каждом заглушка. Когда страница появится,
// маршрут заменяем на настоящий.
const comingSoonPages: { path: string; meta?: RouteMeta }[] = [
  { path: "tracks" },
  { path: "graphs" },
  { path: "plugins", meta: ADMINS },
  { path: "users", meta: ADMINS },
  { path: "profile", meta: SIGNED_IN },
];

const comingSoonRoutes: RouteRecordRaw[] = [];
for (const page of comingSoonPages) {
  comingSoonRoutes.push({
    path: page.path,
    name: page.path,
    meta: page.meta,
    component: () => import("@/pages/coming-soon"),
  });
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/sign-in",
      name: "sign-in",
      component: () => import("@/pages/sign-in"),
    },
    {
      path: "/sign-up",
      name: "sign-up",
      component: () => import("@/pages/sign-up"),
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("@/pages/forgot-password"),
    },
    // Путь задан бэком: ссылка в письме ведёт на /profile/reset_password?token=...
    // (настройка reset-password.recovery-link в wise-task-profile).
    {
      path: "/profile/reset_password",
      name: "reset-password",
      component: () => import("@/pages/reset-password"),
    },
    // Страницы с шапкой
    {
      path: "/",
      component: AppLayout,
      children: [
        {
          path: "",
          redirect: "/sandbox",
        },
        {
          path: "sandbox",
          name: "sandbox",
          component: () => import("@/pages/sandbox"),
        },
        {
          path: "tasks",
          name: "tasks",
          component: () => import("@/pages/tasks"),
        },
        {
          path: "tasks/:id",
          name: "task",
          component: () => import("@/pages/task"),
        },
        {
          path: "solutions",
          name: "solutions",
          meta: SIGNED_IN,
          component: () => import("@/pages/solutions"),
        },
        {
          path: "solutions/:id",
          name: "solution",
          meta: { ...SIGNED_IN, samePage: true },
          component: () => import("@/pages/solution"),
        },
        {
          path: "constructor",
          name: "constructor",
          meta: AUTHORS,
          component: () => import("@/pages/task-constructor"),
        },
        {
          path: "forbidden",
          name: "forbidden",
          component: () => import("@/pages/forbidden"),
        },
        {
          path: "ui-kit",
          name: "ui-kit",
          component: () => import("@/pages/ui-kit"),
        },
        ...comingSoonRoutes,
        {
          path: ":pathMatch(.*)*",
          name: "not-found",
          component: () => import("@/pages/not-found"),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const userStore = useUserStore();
  await userStore.whenReady();

  const access = checkAccess(userStore.user, to.meta);
  if (access === "sign-in") {
    return { name: "sign-in", query: { redirect: to.fullPath } };
  }
  if (access === "forbidden") {
    return { name: "forbidden", query: { from: to.fullPath } };
  }
  return true;
});
