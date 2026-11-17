import { findEdge, findVertex, hasEdge, type Graph, type GraphColor } from "@/entities/graph";
import { canLayout, type LayoutKind } from "./layout";
import { commonColor, type GraphSelection } from "./selection";

export type MenuTarget =
  | { kind: "vertex"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "group" }
  | { kind: "canvas"; x: number; y: number }
  | { kind: "view" };

export type MenuAction =
  | "add-vertex"
  | "layout"
  | "add-loop"
  | "delete"
  | "layout-circle"
  | "layout-grid"
  | "layout-levels"
  | "layout-bipartite"
  | "fit-view"
  | "reset-zoom";

export interface MenuItem {
  action: MenuAction;
  label: string;
  danger: boolean;
  submenu: MenuItem[];
}

export const MENU_WIDTH = 220;
const ITEM_HEIGHT = 36;
const COLORS_HEIGHT = 52;
const MENU_PADDING = 8;

interface LayoutItem {
  action: MenuAction;
  kind: LayoutKind;
  label: string;
}

const LAYOUT_ITEMS: LayoutItem[] = [
  { action: "layout-circle", kind: "circle", label: "По кругу" },
  { action: "layout-grid", kind: "grid", label: "Сеткой" },
  { action: "layout-levels", kind: "levels", label: "По уровням" },
  { action: "layout-bipartite", kind: "bipartite", label: "В две доли" },
];

function menuItem(action: MenuAction, label: string, danger: boolean): MenuItem {
  return { action: action, label: label, danger: danger, submenu: [] };
}

export function layoutOfAction(action: MenuAction): LayoutKind | null {
  for (const item of LAYOUT_ITEMS) {
    if (item.action === action) {
      return item.kind;
    }
  }
  return null;
}

export function buildMenuItems(graph: Graph, target: MenuTarget): MenuItem[] {
  if (target.kind === "vertex") {
    const items: MenuItem[] = [];
    if (!hasEdge(graph, target.id, target.id)) {
      items.push(menuItem("add-loop", "Добавить петлю", false));
    }
    items.push(menuItem("delete", "Удалить вершину", true));
    return items;
  }
  if (target.kind === "edge") {
    return [menuItem("delete", "Удалить ребро", true)];
  }
  if (target.kind === "group") {
    return [menuItem("delete", "Удалить выбранное", true)];
  }
  const items: MenuItem[] = [];
  if (target.kind === "canvas") {
    items.push(menuItem("add-vertex", "Добавить вершину здесь", false));
    const layouts: MenuItem[] = [];
    for (const item of LAYOUT_ITEMS) {
      if (canLayout(graph, item.kind)) {
        layouts.push(menuItem(item.action, item.label, false));
      }
    }
    if (layouts.length > 0) {
      items.push({ action: "layout", label: "Расположить", danger: false, submenu: layouts });
    }
  }
  if (graph.vertices.length > 0) {
    items.push(menuItem("fit-view", "Показать весь граф", false));
  }
  items.push(menuItem("reset-zoom", "Масштаб 100%", false));
  return items;
}

export function hasColorChoice(target: MenuTarget): boolean {
  return target.kind === "vertex" || target.kind === "edge" || target.kind === "group";
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

export function targetColor(
  graph: Graph,
  target: MenuTarget,
  selection: GraphSelection | null,
): GraphColor | null {
  if (target.kind === "vertex") {
    const vertex = findVertex(graph, target.id);
    return vertex ? vertex.color : null;
  }
  if (target.kind === "edge") {
    const edge = findEdge(graph, target.id);
    return edge ? edge.color : null;
  }
  if (target.kind === "group") {
    return commonColor(graph, selection);
  }
  return null;
}

export function submenuOnLeft(menuLeft: number, boxWidth: number): boolean {
  return menuLeft + MENU_WIDTH * 2 > boxWidth;
}
