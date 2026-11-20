import type { EditorTool } from "./selection";

const HINTS: Record<EditorTool, string> = {
  select: "Тяните по пустому месту — рамка. Ctrl+клик — добавить к выбору, Ctrl+A — всё.",
  pan: "Тяните мышью, чтобы двигать холст. Колесо — масштаб. Граф в этом режиме не меняется.",
  vertex: "Кликайте по пустому месту, чтобы добавить вершины. Их можно перетаскивать.",
  edge: "Протяните от вершины к вершине или кликните по обеим. Дважды по одной — петля.",
  delete: "Кликните по вершине или ребру, чтобы удалить.",
};

export const READONLY_HINT = "Только просмотр: граф можно двигать и масштабировать, но не менять.";

export function toolHint(tool: EditorTool, readonly: boolean): string {
  if (readonly) {
    return READONLY_HINT;
  }
  return HINTS[tool];
}
