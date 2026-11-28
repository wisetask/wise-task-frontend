import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { env } from "@/shared/config/env";
import { shouldEndSession } from "./session";
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

const errorLink = onError((response) => {
  const networkError = response.networkError;
  const httpStatus =
    networkError != null && "statusCode" in networkError ? networkError.statusCode : null;

  const classifications: string[] = [];
  for (const error of response.graphQLErrors ?? []) {
    const classification = error.extensions?.classification;
    if (typeof classification === "string") {
      classifications.push(classification);
    }
  }

  const endSession = shouldEndSession({
    httpStatus: httpStatus,
    classifications: classifications,
    keepSession: response.operation.getContext().keepSession === true,
  });

  if (endSession) {
    removeToken();
    unauthorizedHandler?.();
  }
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
