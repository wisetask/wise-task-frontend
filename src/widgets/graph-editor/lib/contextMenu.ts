import { hasEdge, type Graph } from "@/entities/graph";

export type MenuTarget =
  | { kind: "vertex"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "canvas"; x: number; y: number };

export type MenuAction = "add-vertex" | "add-loop" | "delete" | "reset-zoom";

export interface MenuItem {
  action: MenuAction;
  label: string;
  danger: boolean;
}

export const MENU_WIDTH = 220;
const ITEM_HEIGHT = 36;
const COLORS_HEIGHT = 52;
const MENU_PADDING = 8;

export function buildMenuItems(graph: Graph, target: MenuTarget): MenuItem[] {
  if (target.kind === "vertex") {
    const items: MenuItem[] = [];
    if (!hasEdge(graph, target.id, target.id)) {
      items.push({ action: "add-loop", label: "Добавить петлю", danger: false });
    }
    items.push({ action: "delete", label: "Удалить вершину", danger: true });
    return items;
  }
  if (target.kind === "edge") {
    return [{ action: "delete", label: "Удалить ребро", danger: true }];
  }
  return [
    { action: "add-vertex", label: "Добавить вершину здесь", danger: false },
    { action: "reset-zoom", label: "Масштаб 100%", danger: false },
  ];
}

export function hasColorChoice(target: MenuTarget): boolean {
  return target.kind !== "canvas";
}

export function menuHeight(itemCount: number, withColors: boolean): number {
  let height = itemCount * ITEM_HEIGHT + MENU_PADDING;
  if (withColors) {
    height = height + COLORS_HEIGHT;
  }
  return height;
}

export function menuPosition(
  x: number,
  y: number,
  height: number,
  boxWidth: number,
  boxHeight: number,
): { left: number; top: number } {
  let left = x;
  let top = y;
  if (left + MENU_WIDTH > boxWidth) {
    left = Math.max(0, x - MENU_WIDTH);
  }
  if (top + height > boxHeight) {
    top = Math.max(0, y - height);
  }
  return { left: left, top: top };
}
