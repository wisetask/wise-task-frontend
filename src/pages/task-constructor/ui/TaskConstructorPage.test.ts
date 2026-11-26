// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from "@apollo/client/core";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createTaskDraft } from "../model/taskDraft";
import { browserStorage, saveDraft } from "../lib/savedDraft";
import TaskConstructorPage from "./TaskConstructorPage.vue";

enableAutoUnmount(afterEach);

beforeEach(() => {
  window.localStorage.clear();
});

function mountPage(client?: ApolloClient) {
  return mount(TaskConstructorPage, {
    attachTo: document.body,
    global: {
      plugins: [createPinia()],
      provide: client === undefined ? {} : { [DefaultApolloClient]: client },
      stubs: { RouterLink: RouterLinkStub },
    },
  });
}

function tabTitles(wrapper: ReturnType<typeof mount>): string[] {
  const titles: string[] = [];
  for (const tab of wrapper.findAll('[role="tab"]')) {
    titles.push(tab.text());
  }
  return titles;
}

describe("task constructor page", () => {
  it("adds the graph tab when the graph is given", async () => {
    const wrapper = mountPage();
    expect(tabTitles(wrapper)).toEqual(["Основное", "Условия (0 проверок)", "Как увидит студент"]);
    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(tabTitles(wrapper)).toEqual([
      "Основное",
      "Граф",
      "Условия (0 проверок)",
      "Как увидит студент",
    ]);
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    expect(wrapper.find(".graph-editor").exists()).toBe(true);
    expect(wrapper.find(".graph-rules").text()).not.toContain("Вид графа");
  });

  it("makes the given graph directed when the task asks for it", async () => {
    const wrapper = mountPage();
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.find("select").setValue("directed");
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    const summary = wrapper.find(".graph-properties__summary").text();
    expect(summary).toContain("ориентированный");
    expect(summary).not.toContain("неориентированный");
  });

  it("shows what is ready", async () => {
    const wrapper = mountPage();
    const readiness = () => wrapper.find(".constructor__readiness").text();
    expect(readiness()).toContain("Введите название задачи");
    expect(readiness()).toContain("Осталось заполнить: 4.");
    await wrapper.find("input").setValue("Дерево");
    expect(readiness()).not.toContain("Введите название задачи");
    expect(readiness()).toContain("Осталось заполнить: 3.");
  });

  it("lists what is missing instead of creating an unfinished task", async () => {
    const wrapper = mountPage();
    await wrapper.get("#constructor-tab-student").trigger("click");
    await wrapper.find(".constructor__save").trigger("click");
    const notice = wrapper.find(".constructor__notice").text();
    expect(notice).toContain("Чтобы создать задачу, осталось:");
    expect(notice).toContain("Введите название задачи");
    expect(wrapper.find(".constructor__readiness").exists()).toBe(true);
    await wrapper.find("input").setValue("Дерево");
    expect(wrapper.find(".constructor__notice").text()).not.toContain("Введите название задачи");
  });

  it("asks to sign in before creating", async () => {
    const draft = createTaskDraft();
    draft.conditions.push({
      id: "connected-condition",
      pluginId: "connected",
      pluginName: "Граф связный",
      pluginType: "GRAPH_PROPERTY",
      sign: "",
      value: "Выполняется",
      mistakeText: "Граф должен быть связным",
    });
    saveDraft(browserStorage(), draft);
    const wrapper = mountPage();
    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("Дерево");
    await inputs[1].setValue("Деревья");
    await wrapper.find("textarea").setValue("Нарисуйте дерево");
    await wrapper.find(".constructor__save").trigger("click");
    expect(wrapper.find(".constructor__notice").text()).toContain("только после входа");
    expect(wrapper.findComponent(RouterLinkStub).props("to")).toEqual({
      name: "sign-in",
      query: { redirect: "/constructor" },
    });
  });

  it("loads the catalog on demand, retries and warns about incompatible conditions", async () => {
    let requests = 0;
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            requests += 1;
            if (requests === 1) {
              observer.error(new Error("Каталог недоступен"));
              return;
            }
            observer.next({
              data: {
                getAllPlugins: {
                  __typename: "GetAllPluginsResponse",
                  items: [
                    {
                      __typename: "Plugin",
                      id: "connected",
                      name: "Граф связный",
                      description: "Граф должен быть связным",
                      category: "Свойства",
                      pluginType: "GRAPH_PROPERTY",
                      graphType: "UNDIRECT",
                      isValid: true,
                    },
                  ],
                  pagination: { __typename: "PaginationResponse", hasNext: false },
                },
              },
            });
            observer.complete();
          }),
      ),
    });
    const wrapper = mountPage(client);
    try {
      expect(requests).toBe(0);
      await wrapper.get("#constructor-tab-conditions").trigger("click");
      await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toContain("Каталог недоступен");
      await wrapper.get('[role="alert"] + button').trigger("click");
      await flushPromises();
      await wrapper.get('button[aria-label="Добавить: Граф связный"]').trigger("click");
      expect(wrapper.get("legend").text()).toBe("1. Граф связный");

      await wrapper.get("#constructor-tab-main").trigger("click");
      expect(wrapper.get(".constructor__readiness").text()).toContain("Проверки: 1");
      await wrapper.get("select").setValue("directed");
      await wrapper.get("#constructor-tab-conditions").trigger("click");
      expect(wrapper.text()).toContain("Проверка 1 не подходит для такого вида графа");
      expect(wrapper.get("legend").text()).toBe("1. Граф связный");
      expect(wrapper.find('button[aria-label="Добавить: Граф связный"]').exists()).toBe(false);
      expect(requests).toBe(2);
    } finally {
      wrapper.unmount();
      client.stop();
    }
  });

  it("shows the student checks in order without feedback text", async () => {
    const draft = createTaskDraft();
    draft.description = "Раскрасьте граф";
    draft.conditions = [
      {
        id: "colors-condition",
        pluginId: "colors",
        pluginName: "Число цветов",
        pluginType: "GRAPH_CHARACTERISTIC",
        sign: "<",
        value: "4",
        mistakeText: "Слишком много цветов",
      },
      {
        id: "coloring-condition",
        pluginId: "coloring",
        pluginName: "Правильная раскраска",
        pluginType: "GRAPH_PROPERTY",
        sign: "",
        value: "Выполняется",
        mistakeText: "Проверьте соседние вершины",
      },
    ];
    saveDraft(browserStorage(), draft);
    const wrapper = mountPage();
    await wrapper.get("#constructor-tab-student").trigger("click");
    const checks = wrapper.findAll(".constructor__student-conditions li");
    expect(checks.map((item) => item.text().replace(/\s+/g, " "))).toEqual([
      "Число цветов < 4",
      "Правильная раскраска — выполняется",
    ]);
    expect(wrapper.text()).not.toContain("Слишком много цветов");
    expect(wrapper.text()).not.toContain("Проверьте соседние вершины");
  });

  it("lets the author try the task with the student rules", async () => {
    const wrapper = mountPage();
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    const ruleBoxes = wrapper.findAll('.graph-rules input[type="checkbox"]');
    await ruleBoxes[0].setValue(false);
    await ruleBoxes[1].setValue(false);
    await wrapper.findAll('[role="tab"]')[3].trigger("click");
    expect(wrapper.find(".constructor__trial-bar").exists()).toBe(true);
    expect(wrapper.findAll(".graph-toolbar__button[aria-pressed]").length).toBe(2);
    expect(wrapper.find(".constructor__task-hints").text()).toContain("нельзя добавлять");
    expect(wrapper.find(".constructor__task-hints").text()).toContain("копии графа задачи");
    expect(wrapper.find(".constructor__task-graph").text()).toContain("Граф задачи");
    expect(wrapper.find(".constructor__answer").text()).toContain("Ваш ответ");
  });

  it("has no switch for showing only the first mistake", () => {
    const wrapper = mountPage();
    expect(wrapper.text()).not.toContain("первую ошибку");
  });

  it("lets the student pick the kind when the graph is drawn from scratch", async () => {
    const wrapper = mountPage();
    await wrapper.findAll('[role="tab"]')[2].trigger("click");
    expect(wrapper.find(".constructor__task").text()).toContain("Граф студент рисует сам.");
    expect(wrapper.find(".constructor__task-graph").exists()).toBe(false);
    expect(wrapper.find(".constructor__answer").text()).toContain("Ориентированный граф");
  });

  it("keeps the draft after the page is opened again", async () => {
    const first = mountPage();
    await first.find("input").setValue("Дерево");
    first.unmount();
    const second = mountPage();
    expect((second.find("input").element as HTMLInputElement).value).toBe("Дерево");
    expect(second.find(".constructor__title").text()).toBe("Дерево");
  });

  it("clears the draft only after confirmation", async () => {
    const wrapper = mountPage();
    await wrapper.find("input").setValue("Дерево");
    const clearButton = wrapper.findAll(".constructor__actions button")[0];
    await clearButton.trigger("click");
    expect(wrapper.find(".constructor__confirm").exists()).toBe(true);
    await wrapper.findAll(".constructor__actions button")[1].trigger("click");
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("Дерево");
    await wrapper.findAll(".constructor__actions button")[0].trigger("click");
    await wrapper.findAll(".constructor__actions button")[0].trigger("click");
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("");
    expect(wrapper.find(".constructor__title").text()).toBe("Новая задача");
  });
});
