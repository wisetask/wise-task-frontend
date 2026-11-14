import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
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
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/not-found"),
    },
  ],
});
