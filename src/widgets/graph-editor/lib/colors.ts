import type { GraphColor } from "@/entities/graph";

export interface ColorOption {
  value: GraphColor;
  title: string;
}

export const GRAPH_COLORS: ColorOption[] = [
  { value: "GRAY", title: "Серый" },
  { value: "RED", title: "Красный" },
  { value: "GREEN", title: "Зелёный" },
  { value: "BLUE", title: "Синий" },
];

export const ARROW_NAMES = ["gray", "red", "green", "blue", "selected"];

export function colorClass(color: GraphColor): string {
  return color.toLowerCase();
}

export function arrowMarkerId(name: string): string {
  return "graph-arrow-" + name;
}

export function edgeArrow(color: GraphColor, isSelected: boolean): string {
  if (isSelected) {
    return "url(#" + arrowMarkerId("selected") + ")";
  }
  return "url(#" + arrowMarkerId(colorClass(color)) + ")";
}
