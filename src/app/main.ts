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

setUnauthorizedHandler(() => {
  userStore.clearUser();
  router.push({ name: "sign-in" });
});

provideApolloClient(apolloClient);

const app = createApp(App);

app.use(pinia);
app.use(router);
app.mount("#app");

userStore.loadProfile();
