import { findEdge, findVertex, hasEdge, type Graph, type GraphColor } from "@/entities/graph";
import { commonColor, type GraphSelection } from "./selection";

export type MenuTarget =
  | { kind: "vertex"; id: string }
  | { kind: "edge"; id: string }
  | { kind: "group" }
  | { kind: "canvas"; x: number; y: number }
  | { kind: "view" };

export type MenuAction = "add-vertex" | "add-loop" | "delete" | "fit-view" | "reset-zoom";

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
  if (target.kind === "group") {
    return [{ action: "delete", label: "Удалить выбранное", danger: true }];
  }
  const items: MenuItem[] = [];
  if (target.kind === "canvas") {
    items.push({ action: "add-vertex", label: "Добавить вершину здесь", danger: false });
  }
  if (graph.vertices.length > 0) {
    items.push({ action: "fit-view", label: "Показать весь граф", danger: false });
  }
  items.push({ action: "reset-zoom", label: "Масштаб 100%", danger: false });
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
