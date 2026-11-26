import { findEdge, findVertex, hasEdge, type Graph, type GraphColor } from "@/entities/graph";
import { DEFAULT_HOTKEYS, hotkeyText, type HotkeyAction } from "./hotkeys";
import { canLayout, type LayoutKind } from "./layout";
import { allowEverything, canRunMenuAction, type EditorRules } from "./rules";
import { commonColor, type GraphSelection } from "./selection";

export type MenuTarget =
  | { kind: "vertex"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "group" }
  | { kind: "canvas"; x: number; y: number }
  | { kind: "view" };

export type MenuAction =
  | "rename"
  | "add-vertex"
  | "layout"
  | "add-loop"
  | "delete"
  | "layout-auto"
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
  hint: string;
  submenu: MenuItem[];
}

export const MENU_WIDTH = 260;
const ITEM_HEIGHT = 36;
const COLORS_HEIGHT = 52;
const MENU_PADDING = 8;
const TITLE_HEIGHT = 44;
const MAX_NEIGHBORS = 4;

const MENU_HOTKEYS: Partial<Record<MenuAction, HotkeyAction>> = {
  rename: "rename",
  delete: "delete",
  "fit-view": "zoom-fit",
  "reset-zoom": "zoom-reset",
};

interface LayoutItem {
  action: MenuAction;
  kind: LayoutKind;
  label: string;
}

const LAYOUT_ITEMS: LayoutItem[] = [
  { action: "layout-auto", kind: "auto", label: "Автоматически" },
  { action: "layout-circle", kind: "circle", label: "По кругу" },
  { action: "layout-grid", kind: "grid", label: "Сеткой" },
  { action: "layout-levels", kind: "levels", label: "По уровням" },
  { action: "layout-bipartite", kind: "bipartite", label: "В две доли" },
];

export function menuHint(action: MenuAction): string {
  const hotkey = MENU_HOTKEYS[action];
  if (hotkey === undefined) {
    return "";
  }
  return hotkeyText(hotkey, DEFAULT_HOTKEYS);
}

function menuItem(action: MenuAction, label: string, danger: boolean): MenuItem {
  return { action: action, label: label, danger: danger, hint: menuHint(action), submenu: [] };
}

function vertexName(graph: Graph, id: string): string {
  const vertex = findVertex(graph, id);
  if (vertex === undefined || vertex.label === "") {
    return "без подписи";
  }
  return vertex.label;
}

export function neighborNames(graph: Graph, id: string): string[] {
  const ids: string[] = [];
  for (const edge of graph.edges) {
    let other = "";
    if (edge.source === id) {
      other = edge.target;
    } else if (edge.target === id) {
      other = edge.source;
    }
    if (other !== "" && other !== id && !ids.includes(other)) {
      ids.push(other);
    }
  }
  const names: string[] = [];
  for (const other of ids) {
    names.push(vertexName(graph, other));
  }
  return names;
}

function degreeOf(graph: Graph, id: string): number {
  let degree = 0;
  for (const edge of graph.edges) {
    if (edge.source === id) {
      degree = degree + 1;
    }
    if (edge.target === id) {
      degree = degree + 1;
    }
  }
  return degree;
}

export function menuTitle(graph: Graph, target: MenuTarget): string {
  if (target.kind === "vertex") {
    let title = "Вершина " + vertexName(graph, target.id);
    title = title + " · степень " + degreeOf(graph, target.id);
    const names = neighborNames(graph, target.id);
    if (names.length === 0) {
      return title + " · нет соседей";
    }
    title = title + " · соседи " + names.slice(0, MAX_NEIGHBORS).join(", ");
    if (names.length > MAX_NEIGHBORS) {
      title = title + " и ещё " + (names.length - MAX_NEIGHBORS);
    }
    return title;
  }
  if (target.kind === "edge") {
    const edge = findEdge(graph, target.id);
    if (edge === undefined) {
      return "Ребро";
    }
    const arrow = graph.isDirected ? " → " : " — ";
    return "Ребро " + vertexName(graph, edge.source) + arrow + vertexName(graph, edge.target);
  }
  if (target.kind === "group") {
    return "Выбрано несколько объектов";
  }
  return "";
}

export function layoutOfAction(action: MenuAction): LayoutKind | null {
  for (const item of LAYOUT_ITEMS) {
    if (item.action === action) {
      return item.kind;
    }
  }
  return null;
}

export function buildMenuItems(
  graph: Graph,
  target: MenuTarget,
  rules: EditorRules = allowEverything(),
): MenuItem[] {
  const items: MenuItem[] = [];
  for (const item of allMenuItems(graph, target)) {
    if (canRunMenuAction(item.action, rules)) {
      items.push(item);
    }
  }
  return items;
}

function allMenuItems(graph: Graph, target: MenuTarget): MenuItem[] {
  if (target.kind === "vertex") {
    const items: MenuItem[] = [menuItem("rename", "Переименовать", false)];
    if (!hasEdge(graph, target.id, target.id)) {
      items.push(menuItem("add-loop", "Добавить петлю", false));
    }
    items.push(menuItem("delete", "Удалить вершину", true));
    return items;
  }
  if (target.kind === "edge") {
    return [menuItem("rename", "Подписать", false), menuItem("delete", "Удалить ребро", true)];
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
      items.push({
        action: "layout",
        label: "Расположить",
        danger: false,
        hint: "",
        submenu: layouts,
      });
    }
  }
  if (graph.vertices.length > 0) {
    items.push(menuItem("fit-view", "Показать весь граф", false));
  }
  items.push(menuItem("reset-zoom", "Масштаб 100%", false));
  return items;
}

export function hasColorChoice(
  target: MenuTarget,
  rules: EditorRules = allowEverything(),
): boolean {
  if (!rules.canColor) {
    return false;
  }
  return target.kind === "vertex" || target.kind === "edge" || target.kind === "group";
}

export function menuHeight(itemCount: number, withColors: boolean, withTitle = false): number {
  let height = itemCount * ITEM_HEIGHT + MENU_PADDING;
  if (withColors) {
    height = height + COLORS_HEIGHT;
  }
  if (withTitle) {
    height = height + TITLE_HEIGHT;
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
