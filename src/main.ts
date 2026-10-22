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
import { useProfileStore } from "@/store/profile";
import "@/api/rest/eventsInit";

async function getAuthToken(): Promise<string | null> {
  return await UserStorageGetters.getToken();
}

const cache = new InMemoryCache({ addTypename: false });

const httpLink = new HttpLink({
  uri: "https://wisetask.ru/graphql",
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

function redirectToSignIn() {
  if (router.currentRoute.value.path === "/auth/signIn") {
    return;
  }
  console.warn("Unauthorized error detected. Redirecting to /auth/signIn");
  // Токен и пользователя в памяти чистим ДО перехода: signIn при живом
  // токене в заголовке получит от бэкенда 401, а catch-all редирект
  // роутера смотрит на profileStore.activeUser.
  UserStorageGetters.removeToken();
  useProfileStore().activeUser = null;
  router.push("/auth/signIn");
}

const errorLink = onError(({ graphQLErrors, networkError }) => {
  // При истёкшем/невалидном токене сервер отвечает HTTP 401 с пустым телом.
  // Это не GraphQL-ошибка, а ServerError у networkError — проверяем статус.
  if (
    networkError &&
    "statusCode" in networkError &&
    (networkError as { statusCode?: number }).statusCode === 401
  ) {
    redirectToSignIn();
    return;
  }

  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      );

      // Бэкенд маппит gRPC UNAUTHENTICATED в ErrorType.UNAUTHORIZED
      // (extensions.errorType === "Unauthorized"). Сюда попадаем в том числе
      // при истёкшем access-токене.
      const isUnauthorized =
        extensions?.errorType === "Unauthorized" ||
        message == "Access Denied" ||
        /unauthenticated|expired|invalid token/i.test(message);

      if (isUnauthorized) {
        redirectToSignIn();
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
app.mount("#app");
