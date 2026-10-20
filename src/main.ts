/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
// Components
import App from "./App.vue";

import { createApp, h } from "vue";

import { provideApolloClient } from "@vue/apollo-composable";
import {
  ApolloClient,
  InMemoryCache,
  from,
  HttpLink,
} from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import router from "./router";
import { setContext } from "@apollo/client/link/context";
import { UserStorageKeys } from "@/entities/user/storage/config";
import { UserStorageGetters } from "@/entities/user/storage/getters";
import "@/api/rest/eventsInit";

async function getAuthToken(): Promise<string | null> {
  return await UserStorageGetters.getToken();
}

const cache = new InMemoryCache({ addTypename: false });

const httpLink = new HttpLink({
  uri: "https://wisetask.ru:82/graphql",
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getAuthToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      );

      if (message == "Access Denied") {
        console.warn(
          "Access Denied error detected. Redirecting to /auth/signup",
        );
        router.push("/auth/signup");
      }
    });

  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
  }
});

const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
});

const app = createApp({
  setup() {
    provideApolloClient(apolloClient);
  },

  render: () => h(App),
});

registerPlugins(app);
app.use(router);
app.mount("#app");
