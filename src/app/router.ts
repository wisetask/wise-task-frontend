import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import AppLayout from "./layouts/AppLayout.vue";

// Разделы, которых пока нет: на каждом заглушка. Когда страница появится,
// маршрут заменяем на настоящий.
const comingSoonPaths = ["tracks", "tasks", "graphs", "solutions", "plugins", "users", "profile"];

const comingSoonRoutes: RouteRecordRaw[] = [];
for (const path of comingSoonPaths) {
  comingSoonRoutes.push({
    path: path,
    name: path,
    component: () => import("@/pages/coming-soon"),
  });
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Вход и регистрация: снаружи AppLayout, шапки на них нет.
    // Имя "sign-in" нужно app/main.ts: туда ведёт перенаправление при 401.
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
          path: "constructor",
          name: "constructor",
          component: () => import("@/pages/task-constructor"),
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
