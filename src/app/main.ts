import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";
import { apolloClient, setUnauthorizedHandler } from "@/shared/api";
import { provideApolloClient } from "@vue/apollo-composable";

setUnauthorizedHandler(() => {
  router.push({ name: "sign-in" });
});

provideApolloClient(apolloClient);

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
