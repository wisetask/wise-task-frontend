import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";
import { createApolloClient } from "@/shared/api/client";
import { provideApolloClient } from "@vue/apollo-composable";

const apolloClient = createApolloClient(() => {
    if(router.currentRoute.value.path !== "/sign-in"){
        router.push('/sign-in');
    }
});
provideApolloClient(apolloClient);

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
