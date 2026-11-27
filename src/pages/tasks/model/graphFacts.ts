export type FactShape = "tree" | "cycle" | "k4" | "k5" | "bipartite" | "petersen";

export interface GraphFact {
  title: string;
  text: string;
  shape: FactShape;
}

export interface ShapePicture {
  points: { x: number; y: number }[];
  edges: number[][];
}

export const GRAPH_FACTS: GraphFact[] = [
  {
    title: "Лемма о рукопожатиях",
    text: "Сумма степеней всех вершин всегда чётная: она равна удвоенному числу рёбер.",
    shape: "k4",
  },
  {
    title: "Деревья",
    text: "В любом дереве с n вершинами ровно n − 1 ребро.",
    shape: "tree",
  },
  {
    title: "Формула Эйлера",
    text: "У связного плоского графа вершины − рёбра + грани = 2.",
    shape: "k4",
  },
  {
    title: "Теорема Куратовского",
    text: "Граф плоский, если в нём нет подразбиений K₅ и K₃,₃.",
    shape: "k5",
  },
  {
    title: "Двудольные графы",
    text: "Граф двудольный тогда и только тогда, когда в нём нет циклов нечётной длины.",
    shape: "bipartite",
  },
  {
    title: "Эйлеров цикл",
    text: "Он есть в связном графе тогда и только тогда, когда степени всех вершин чётные.",
    shape: "cycle",
  },
  {
    title: "Полный граф",
    text: "У полного графа на n вершинах n(n − 1)/2 рёбер.",
    shape: "k5",
  },
  {
    title: "Граф Петерсена",
    text: "10 вершин, 15 рёбер, у каждой вершины степень 3 — любимый контрпример теории графов.",
    shape: "petersen",
  },
  {
    title: "Теорема Рамсея",
    text: "Среди любых шести человек есть трое попарно знакомых или трое попарно незнакомых.",
    shape: "cycle",
  },
  {
    title: "Четыре краски",
    text: "Любую карту можно раскрасить четырьмя цветами. Доказали в 1976 году с помощью компьютера.",
    shape: "k4",
  },
];

function ring(count: number, radius: number, shift: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < count; index++) {
    const angle = -Math.PI / 2 + shift + (Math.PI * 2 * index) / count;
    points.push({
      x: Math.round((50 + Math.cos(angle) * radius) * 10) / 10,
      y: Math.round((40 + Math.sin(angle) * radius) * 10) / 10,
    });
  }
  return points;
}

function allPairs(count: number): number[][] {
  const edges: number[][] = [];
  for (let first = 0; first < count; first++) {
    for (let second = first + 1; second < count; second++) {
      edges.push([first, second]);
    }
  }
  return edges;
}

export function shapePicture(shape: FactShape): ShapePicture {
  if (shape === "tree") {
    return {
      points: [
        { x: 50, y: 10 },
        { x: 28, y: 38 },
        { x: 72, y: 38 },
        { x: 16, y: 68 },
        { x: 40, y: 68 },
        { x: 84, y: 68 },
      ],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ],
    };
  }
  if (shape === "cycle") {
    const edges: number[][] = [];
    for (let index = 0; index < 6; index++) {
      edges.push([index, (index + 1) % 6]);
    }
    return { points: ring(6, 30, 0), edges: edges };
  }
  if (shape === "k5") {
    return { points: ring(5, 30, 0), edges: allPairs(5) };
  }
  if (shape === "bipartite") {
    const points: { x: number; y: number }[] = [];
    for (let index = 0; index < 3; index++) {
      points.push({ x: 22 + index * 28, y: 14 });
    }
    for (let index = 0; index < 3; index++) {
      points.push({ x: 22 + index * 28, y: 66 });
    }
    const edges: number[][] = [];
    for (let top = 0; top < 3; top++) {
      for (let bottom = 3; bottom < 6; bottom++) {
        edges.push([top, bottom]);
      }
    }
    return { points: points, edges: edges };
  }
  if (shape === "petersen") {
    const outer = ring(5, 34, 0);
    const inner = ring(5, 15, 0);
    const edges: number[][] = [];
    for (let index = 0; index < 5; index++) {
      edges.push([index, (index + 1) % 5]);
      edges.push([index, index + 5]);
      edges.push([index + 5, ((index + 2) % 5) + 5]);
    }
    return { points: outer.concat(inner), edges: edges };
  }
  return { points: ring(4, 28, Math.PI / 4), edges: allPairs(4) };
}

export function nextFactIndex(current: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return (current + 1) % count;
}
