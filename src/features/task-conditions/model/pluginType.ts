import type { PluginType } from "./plugin";

export function pluginTypeTitle(type: PluginType): string {
  if (type === "GRAPH_CHARACTERISTIC") {
    return "Число";
  }
  if (type === "GRAPH_NEW_GRAPH") {
    return "Новый граф";
  }
  if (type === "GRAPH_STRING") {
    return "Строка";
  }
  return "Свойство";
}

export function pluginTypeHint(type: PluginType): string {
  if (type === "GRAPH_CHARACTERISTIC") {
    return "Считает число и сравнивает его со значением";
  }
  if (type === "GRAPH_NEW_GRAPH") {
    return "Строит новый граф и проверяет его";
  }
  if (type === "GRAPH_STRING") {
    return "Сравнивает строку";
  }
  return "Проверяет, выполняется ли свойство";
}

export function usedText(count: number): string {
  if (count <= 0) {
    return "";
  }
  if (count === 1) {
    return "Уже в задаче";
  }
  return "В задаче: " + count;
}

export function pluginCategories(plugins: readonly { category: string }[]): string[] {
  const categories: string[] = [];
  for (const plugin of plugins) {
    if (!categories.includes(plugin.category)) {
      categories.push(plugin.category);
    }
  }
  return categories;
}
