import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/sandbox",
    },
    {
      path: "/sandbox",
      name: "sandbox",
      component: () => import("@/pages/sandbox"),
    },
    {
      path: "/ui-kit",
      name: "ui-kit",
      component: () => import("@/pages/ui-kit"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/not-found"),
    },
  ],
});
