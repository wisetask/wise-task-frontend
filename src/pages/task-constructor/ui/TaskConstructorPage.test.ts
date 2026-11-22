// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import TaskConstructorPage from "./TaskConstructorPage.vue";

enableAutoUnmount(afterEach);

beforeEach(() => {
  window.localStorage.clear();
});

function tabTitles(wrapper: ReturnType<typeof mount>): string[] {
  const titles: string[] = [];
  for (const tab of wrapper.findAll('[role="tab"]')) {
    titles.push(tab.text());
  }
  return titles;
}

describe("task constructor page", () => {
  it("adds the graph tab when the graph is given", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
    expect(tabTitles(wrapper)).toEqual(["Основное", "Условия", "Как увидит студент"]);
    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(tabTitles(wrapper)).toEqual(["Основное", "Граф", "Условия", "Как увидит студент"]);
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    expect(wrapper.find(".graph-editor").exists()).toBe(true);
    expect(wrapper.find(".graph-rules").text()).not.toContain("Вид графа");
  });

  it("makes the given graph directed when the task asks for it", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.find("select").setValue("directed");
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    const summary = wrapper.find(".graph-properties__summary").text();
    expect(summary).toContain("ориентированный");
    expect(summary).not.toContain("неориентированный");
  });

  it("shows what is ready and keeps saving off for now", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
    const readiness = () => wrapper.find(".constructor__readiness").text();
    expect(readiness()).toContain("Введите название задачи");
    expect(readiness()).toContain("Осталось заполнить: 3.");
    await wrapper.find("input").setValue("Дерево");
    expect(readiness()).not.toContain("Введите название задачи");
    expect(readiness()).toContain("Осталось заполнить: 2.");
    expect(wrapper.find(".constructor__save").attributes("disabled")).toBeDefined();
  });

  it("lets the author try the task with the student rules", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.findAll('[role="tab"]')[1].trigger("click");
    const ruleBoxes = wrapper.findAll('.graph-rules input[type="checkbox"]');
    await ruleBoxes[0].setValue(false);
    await ruleBoxes[1].setValue(false);
    await wrapper.findAll('[role="tab"]')[3].trigger("click");
    expect(wrapper.find(".constructor__trial-bar").exists()).toBe(true);
    expect(wrapper.findAll(".graph-toolbar__button[aria-pressed]").length).toBe(2);
    expect(wrapper.find(".constructor__task-hints").text()).toContain("нельзя добавлять");
  });

  it("lets the student pick the kind when the graph is drawn from scratch", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
    await wrapper.findAll('[role="tab"]')[2].trigger("click");
    expect(wrapper.find(".constructor__task").text()).toContain("Граф студент рисует сам.");
    expect(wrapper.find(".constructor__task").text()).toContain("Ориентированный граф");
  });

  it("keeps the draft after the page is opened again", async () => {
    const first = mount(TaskConstructorPage, { attachTo: document.body });
    await first.find("input").setValue("Дерево");
    first.unmount();
    const second = mount(TaskConstructorPage, { attachTo: document.body });
    expect((second.find("input").element as HTMLInputElement).value).toBe("Дерево");
    expect(second.find(".constructor__title").text()).toBe("Дерево");
  });

  it("clears the draft only after confirmation", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
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
