import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { env } from "@/shared/config/env";
import { getToken, removeToken } from "./token";
import { onError } from "@apollo/client/link/error";


export function createApolloClient(onUnauthorized: () => void){
    const httpLink = new HttpLink({ uri: env.graphqlUrl});

    const authLink = setContext((_, {headers}) => {
        const token = getToken();
        if(!token){
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
        const isHttp401 = networkError != null && "statusCode" in networkError && networkError.statusCode === 401;
        const isGraphqlUnauthorized = graphQLErrors?.some((error) => error.extensions?.errorType === 'Unauthorized')

        if (isHttp401 || isGraphqlUnauthorized) {
            removeToken();
            onUnauthorized();
        }
    })

    return new ApolloClient({ link: ApolloLink.from([errorLink, authLink, httpLink]), cache: new InMemoryCache() });
}
