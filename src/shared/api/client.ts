import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { env } from "@/shared/config/env";
import { getToken, removeToken } from "./token";

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

const httpLink = new HttpLink({ uri: env.graphqlUrl });

// Вход и регистрация бэк принимает только без токена: с токеном отвечает Access Denied.
// Такие запросы передают context: { skipAuth: true }.
const authLink = setContext((_, { headers, skipAuth }) => {
  const token = getToken();
  if (!token || skipAuth) {
    return { headers };
  }

  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const isHttp401 =
    networkError != null && "statusCode" in networkError && networkError.statusCode === 401;
  const isGraphqlUnauthorized = graphQLErrors?.some(
    (error) => error.extensions?.classification === "UNAUTHORIZED",
  );

  if (isHttp401 || isGraphqlUnauthorized) {
    removeToken();
    unauthorizedHandler?.();
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
