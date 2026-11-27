import { addEdge, addVertex, createEmptyGraph, type Graph } from "@/entities/graph";

export type TemplateId =
  "path" | "cycle" | "complete" | "star" | "bipartite" | "tree" | "cube" | "petersen";

export interface GraphTemplate {
  id: TemplateId;
  title: string;
  note: string;
}

export interface GraphShape {
  points: number[][];
  links: number[][];
}

export const GRAPH_TEMPLATES: GraphTemplate[] = [
  { id: "path", title: "Путь", note: "5 вершин подряд" },
  { id: "cycle", title: "Цикл", note: "6 вершин по кругу" },
  { id: "complete", title: "Полный граф", note: "K₅, все со всеми" },
  { id: "star", title: "Звезда", note: "центр и 6 листьев" },
  { id: "bipartite", title: "Двудольный", note: "K₃,₃" },
  { id: "tree", title: "Дерево", note: "двоичное, 7 вершин" },
  { id: "cube", title: "Куб", note: "8 вершин, 12 рёбер" },
  { id: "petersen", title: "Граф Петерсена", note: "10 вершин, 15 рёбер" },
];

const CENTER_X = 360;
const CENTER_Y = 260;

function circlePoints(count: number, radius: number, turn: number): number[][] {
  const points: number[][] = [];
  for (let index = 0; index < count; index++) {
    const angle = -Math.PI / 2 + turn + (index * 2 * Math.PI) / count;
    points.push([Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)]);
  }
  return points;
}

function ringLinks(count: number, first: number): number[][] {
  const links: number[][] = [];
  for (let index = 0; index < count; index++) {
    links.push([first + index, first + ((index + 1) % count)]);
  }
  return links;
}

export function templateShape(id: TemplateId): GraphShape {
  if (id === "path") {
    const points: number[][] = [];
    const links: number[][] = [];
    for (let index = 0; index < 5; index++) {
      points.push([(index - 2) * 120, index % 2 === 0 ? 0 : -50]);
      if (index > 0) {
        links.push([index - 1, index]);
      }
    }
    return { points: points, links: links };
  }
  if (id === "cycle") {
    return { points: circlePoints(6, 150, 0), links: ringLinks(6, 0) };
  }
  if (id === "complete") {
    const links: number[][] = [];
    for (let first = 0; first < 5; first++) {
      for (let second = first + 1; second < 5; second++) {
        links.push([first, second]);
      }
    }
    return { points: circlePoints(5, 160, 0), links: links };
  }
  if (id === "star") {
    const points = [[0, 0]].concat(circlePoints(6, 160, 0));
    const links: number[][] = [];
    for (let index = 1; index <= 6; index++) {
      links.push([0, index]);
    }
    return { points: points, links: links };
  }
  if (id === "bipartite") {
    const points: number[][] = [];
    for (let index = 0; index < 3; index++) {
      points.push([(index - 1) * 150, -100]);
    }
    for (let index = 0; index < 3; index++) {
      points.push([(index - 1) * 150, 100]);
    }
    const links: number[][] = [];
    for (let top = 0; top < 3; top++) {
      for (let bottom = 3; bottom < 6; bottom++) {
        links.push([top, bottom]);
      }
    }
    return { points: points, links: links };
  }
  if (id === "tree") {
    return {
      points: [
        [0, -140],
        [-160, -20],
        [160, -20],
        [-240, 110],
        [-80, 110],
        [80, 110],
        [240, 110],
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [2, 6],
      ],
    };
  }
  if (id === "cube") {
    const points = [
      [-140, -140],
      [140, -140],
      [140, 140],
      [-140, 140],
      [-60, -60],
      [60, -60],
      [60, 60],
      [-60, 60],
    ];
    const links = ringLinks(4, 0).concat(ringLinks(4, 4));
    for (let index = 0; index < 4; index++) {
      links.push([index, index + 4]);
    }
    return { points: points, links: links };
  }
  const points = circlePoints(5, 170, 0).concat(circlePoints(5, 80, 0));
  const links = ringLinks(5, 0);
  for (let index = 0; index < 5; index++) {
    links.push([index, index + 5]);
  }
  for (let index = 0; index < 5; index++) {
    links.push([5 + index, 5 + ((index + 2) % 5)]);
  }
  return { points: points, links: links };
}

export function buildTemplate(id: TemplateId, isDirected: boolean): Graph {
  const shape = templateShape(id);
  let graph = createEmptyGraph(isDirected);
  const ids: string[] = [];
  for (const point of shape.points) {
    graph = addVertex(graph, CENTER_X + point[0], CENTER_Y + point[1]);
    ids.push(graph.vertices[graph.vertices.length - 1].id);
  }
  for (const link of shape.links) {
    graph = addEdge(graph, ids[link[0]], ids[link[1]]);
  }
  return graph;
}

export function findTemplate(id: TemplateId): GraphTemplate {
  for (const template of GRAPH_TEMPLATES) {
    if (template.id === id) {
      return template;
    }
  }
  return GRAPH_TEMPLATES[0];
}
