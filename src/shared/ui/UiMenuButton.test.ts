// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import UiMenuButton from "./UiMenuButton.vue";

const ITEMS = [
  { id: "json", label: "Граф (.json)", hint: "Можно открыть снова" },
  { id: "png", label: "Картинка PNG" },
];

function mountMenu() {
  return mount(UiMenuButton, {
    props: { label: "Скачать", items: ITEMS },
    attachTo: document.body,
  });
}

describe("UiMenuButton", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens the list on click and reports the chosen item", async () => {
    const wrapper = mountMenu();
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    await wrapper.find("button").trigger("click");
    const items = wrapper.findAll('[role="menuitem"]');
    expect(items.length).toBe(2);
    expect(items[0].text()).toContain("Можно открыть снова");
    await items[1].trigger("click");
    expect(wrapper.emitted("select")).toEqual([["png"]]);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("opens from the keyboard and closes with Esc", async () => {
    const wrapper = mountMenu();
    await wrapper.find("button").trigger("keydown", { key: "ArrowDown" });
    await flushPromises();
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);
    expect(document.activeElement?.textContent).toContain("Граф (.json)");
    await wrapper.find('[role="menu"]').trigger("keydown", { key: "Escape" });
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("closes when the user clicks somewhere else", async () => {
    const wrapper = mountMenu();
    await wrapper.find("button").trigger("click");
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    await flushPromises();
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
