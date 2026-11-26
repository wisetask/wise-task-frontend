// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { enableAutoUnmount, mount, RouterLinkStub } from "@vue/test-utils";
import { createPinia } from "pinia";
import TaskConstructorPage from "./TaskConstructorPage.vue";

enableAutoUnmount(afterEach);

beforeEach(() => {
  window.localStorage.clear();
});

function mountPage() {
  return mount(TaskConstructorPage, {
    attachTo: document.body,
    global: {
      plugins: [createPinia()],
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
    expect(tabTitles(wrapper)).toEqual(["Основное", "Условия", "Как увидит студент"]);
    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(tabTitles(wrapper)).toEqual(["Основное", "Граф", "Условия", "Как увидит студент"]);
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    expect(wrapper.find(".graph-editor").exists()).toBe(true);
    expect(wrapper.find(".graph-rules").text()).not.toContain("Вид графа");
  });

  it("makes the given graph directed when the task asks for it", async () => {
    const wrapper = mountPage();
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.find("select").setValue("directed");
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    const summary = wrapper.find(".graph-properties__type").text();
    expect(summary).toContain("ориентированный");
    expect(summary).not.toContain("неориентированный");
  });

  it("shows what is ready", async () => {
    const wrapper = mountPage();
    const readiness = () => wrapper.find(".constructor__readiness").text();
    expect(readiness()).toContain("Введите название задачи");
    expect(readiness()).toContain("Осталось заполнить: 3.");
    await wrapper.find("input").setValue("Дерево");
    expect(readiness()).not.toContain("Введите название задачи");
    expect(readiness()).toContain("Осталось заполнить: 2.");
  });

  it("lists what is missing instead of creating an unfinished task", async () => {
    const wrapper = mountPage();
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    await wrapper.find(".constructor__save").trigger("click");
    const notice = wrapper.find(".constructor__notice").text();
    expect(notice).toContain("Чтобы создать задачу, осталось:");
    expect(notice).toContain("Введите название задачи");
    expect(wrapper.find(".constructor__readiness").exists()).toBe(true);
    await wrapper.find("input").setValue("Дерево");
    expect(wrapper.find(".constructor__notice").text()).not.toContain("Введите название задачи");
  });

  it("asks to sign in before creating", async () => {
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
