import { describe, expect, it } from "vitest";
import { pluginCategories, pluginTypeHint, pluginTypeTitle, usedText } from "./pluginType";

describe("plugin type", () => {
  it("names every plugin type", () => {
    expect(pluginTypeTitle("GRAPH_PROPERTY")).toBe("Свойство");
    expect(pluginTypeTitle("GRAPH_CHARACTERISTIC")).toBe("Число");
    expect(pluginTypeTitle("GRAPH_NEW_GRAPH")).toBe("Новый граф");
    expect(pluginTypeTitle("GRAPH_STRING")).toBe("Строка");
    expect(pluginTypeHint("GRAPH_PROPERTY")).toContain("свойство");
  });

  it("tells how many times a plugin is used", () => {
    expect(usedText(0)).toBe("");
    expect(usedText(1)).toBe("Уже в задаче");
    expect(usedText(3)).toBe("В задаче: 3");
  });

  it("lists categories once in catalog order", () => {
    expect(
      pluginCategories([{ category: "Свойства" }, { category: "Числа" }, { category: "Свойства" }]),
    ).toEqual(["Свойства", "Числа"]);
  });
});
