// @vitest-environment happy-dom
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  type FetchResult,
} from "@apollo/client/core";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { flushPromises, mount } from "@vue/test-utils";
import { print } from "graphql";
import { expect, it, vi } from "vitest";
import TaskConditionsDemo from "./TaskConditionsDemo.vue";

it("loads catalog pages on demand and adds a plugin from the second page", async () => {
  const link = vi.fn(
    (operation: Parameters<ApolloLink["request"]>[0]) =>
      new Observable<FetchResult>((observer) => {
        const { page } = operation.variables;
        observer.next({
          data: {
            getAllPlugins: {
              __typename: "GetAllPluginsResponse",
              items: [
                {
                  __typename: "Plugin",
                  id: String(page),
                  name: page === 0 ? "Размер графа" : "Диаметр графа",
                  description: "Проверьте граф",
                  category: "Характеристики",
                  pluginType: "GRAPH_CHARACTERISTIC",
                  graphType: "ANY",
                  isValid: true,
                },
              ],
              pagination: { __typename: "PaginationResponse", hasNext: page === 0 },
            },
          },
        });
        observer.complete();
      }),
  );
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(link),
  });
  const wrapper = mount(TaskConditionsDemo, {
    global: { provide: { [DefaultApolloClient]: client } },
  });

  try {
    expect(wrapper.text()).toContain("Граф связный");
    expect(link).not.toHaveBeenCalled();

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(link.mock.calls.map(([operation]) => operation.variables)).toEqual([
      { page: 0, pageSize: 50 },
      { page: 1, pageSize: 50 },
    ]);
    for (const [operation] of link.mock.calls) {
      expect(print(operation.query)).toContain("filter: {isValid: true}");
    }
    expect(wrapper.text()).toContain("Размер графа");
    await wrapper.get("input").setValue("диаметр");
    await wrapper.get('button[aria-label="Добавить: Диаметр графа"]').trigger("click");
    expect(wrapper.get("legend").text()).toBe("1. Диаметр графа");
  } finally {
    wrapper.unmount();
    client.stop();
  }
});
