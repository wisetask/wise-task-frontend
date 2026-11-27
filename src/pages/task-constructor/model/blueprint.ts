import { templateShape, type GraphShape } from "./graphTemplates";
import type { SketchId } from "./constructorEggs";

export const BLUEPRINT_WIDTH = 1600;
export const BLUEPRINT_HEIGHT = 900;
export const GRID_STEP = 24;

const VERTEX_TIME = 150;
const EDGE_TIME = 110;
const GUIDE_TIME = 900;

export interface SketchVertex {
  x: number;
  y: number;
  delay: number;
  label: string;
}

export interface SketchEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}

export interface SketchGuide {
  cx: number;
  cy: number;
  r: number;
}

export interface SketchPlan {
  vertices: SketchVertex[];
  edges: SketchEdge[];
  guide: SketchGuide | null;
  stroke: string;
  duration: number;
  captionX: number;
  captionY: number;
}

export const SKETCH_ORDER: SketchId[] = [
  "cycle",
  "complete",
  "tree",
  "petersen",
  "cube",
  "bipartite",
  "star",
  "path",
];

export const SKETCH_TITLES: Record<SketchId, string> = {
  path: "путь P₅",
  cycle: "цикл C₆",
  complete: "полный граф K₅",
  star: "звезда K₁,₆",
  bipartite: "двудольный K₃,₃",
  tree: "двоичное дерево",
  cube: "куб Q₃",
  petersen: "граф Петерсена",
  envelope: "конверт одним росчерком",
};

export const ENVELOPE_ORDER = [0, 3, 2, 0, 1, 3, 4, 2, 1];

function envelopeShape(): GraphShape {
  const points = [
    [-130, 130],
    [130, 130],
    [130, -100],
    [-130, -100],
    [0, -220],
  ];
  const links: number[][] = [];
  for (let index = 1; index < ENVELOPE_ORDER.length; index++) {
    links.push([ENVELOPE_ORDER[index - 1], ENVELOPE_ORDER[index]]);
  }
  return { points: points, links: links };
}

export function sketchShape(id: SketchId): GraphShape {
  if (id === "envelope") {
    return envelopeShape();
  }
  return templateShape(id);
}

function hasRing(id: SketchId): boolean {
  return id === "cycle" || id === "complete" || id === "petersen" || id === "star";
}

export function sketchPlan(id: SketchId, x: number, y: number, scale: number): SketchPlan {
  const shape = sketchShape(id);
  const vertices: SketchVertex[] = [];
  let radius = 0;
  let lowest = 0;
  const start = hasRing(id) ? GUIDE_TIME : 200;
  for (let index = 0; index < shape.points.length; index++) {
    const point = shape.points[index];
    const px = Math.round(x + point[0] * scale);
    const py = Math.round(y + point[1] * scale);
    radius = Math.max(radius, Math.hypot(point[0], point[1]) * scale);
    lowest = Math.max(lowest, point[1] * scale);
    vertices.push({ x: px, y: py, delay: start + index * VERTEX_TIME, label: "v" + (index + 1) });
  }
  const edgesStart = start + shape.points.length * VERTEX_TIME + 200;
  const edges: SketchEdge[] = [];
  for (let index = 0; index < shape.links.length; index++) {
    const link = shape.links[index];
    edges.push({
      x1: vertices[link[0]].x,
      y1: vertices[link[0]].y,
      x2: vertices[link[1]].x,
      y2: vertices[link[1]].y,
      delay: edgesStart + index * EDGE_TIME,
    });
  }
  let guide: SketchGuide | null = null;
  if (hasRing(id)) {
    guide = { cx: x, cy: y, r: Math.round(radius) };
  }
  let stroke = "";
  if (id === "envelope") {
    const parts: string[] = [];
    for (let index = 0; index < ENVELOPE_ORDER.length; index++) {
      const vertex = vertices[ENVELOPE_ORDER[index]];
      parts.push((index === 0 ? "M " : "L ") + vertex.x + " " + vertex.y);
    }
    stroke = parts.join(" ");
  }
  return {
    vertices: vertices,
    edges: edges,
    guide: guide,
    stroke: stroke,
    duration: edgesStart + shape.links.length * EDGE_TIME + 400,
    captionX: x,
    captionY: Math.round(y + Math.max(lowest, radius * 0.9) + 46),
  };
}

export function sketchSpot(index: number): number[] {
  const spots = [
    [240, 330],
    [1360, 560],
    [260, 640],
    [1340, 280],
    [800, 720],
    [1380, 760],
    [220, 180],
  ];
  return spots[index % spots.length];
}

export function nextSketch(index: number, special: SketchId | ""): SketchId {
  if (special !== "") {
    return special;
  }
  return SKETCH_ORDER[index % SKETCH_ORDER.length];
}

export function coordLabel(x: number, y: number): string {
  return "x = " + Math.round(x / GRID_STEP) + ", y = " + Math.round(y / GRID_STEP);
}
