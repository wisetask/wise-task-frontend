// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import TaskConstructorPage from "./TaskConstructorPage.vue";

enableAutoUnmount(afterEach);

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
    expect(tabTitles(wrapper)).toEqual(["Основное", "Условия"]);
    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(tabTitles(wrapper)).toEqual(["Основное", "Граф", "Условия"]);
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

  it("lists what is missing and keeps saving off for now", async () => {
    const wrapper = mount(TaskConstructorPage, { attachTo: document.body });
    expect(wrapper.find(".constructor__problems").text()).toContain("Введите название задачи");
    await wrapper.find("input").setValue("Дерево");
    expect(wrapper.find(".constructor__problems").text()).not.toContain("название");
    expect(wrapper.find(".constructor__save").attributes("disabled")).toBeDefined();
  });
});
