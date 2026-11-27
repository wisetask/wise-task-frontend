import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";
import { apolloClient, setUnauthorizedHandler } from "@/shared/api";
import { provideApolloClient } from "@vue/apollo-composable";
import { useUserStore } from "@/entities/user";

const pinia = createPinia();
const userStore = useUserStore(pinia);

const AUTH_ROUTE_NAMES = ["sign-in", "sign-up", "forgot-password", "reset-password"];

setUnauthorizedHandler(() => {
  userStore.clearUser();
  const current = router.currentRoute.value;
  if (AUTH_ROUTE_NAMES.includes(String(current.name))) {
    return;
  }
  router.push({ name: "sign-in", query: { redirect: current.fullPath } });
});

provideApolloClient(apolloClient);

userStore.loadProfile();

const app = createApp(App);

app.use(pinia);
app.use(router);
app.mount("#app");
