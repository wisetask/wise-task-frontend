export interface WheelPoint {
  x: number;
  y: number;
}

export interface WheelGraph {
  center: WheelPoint;
  rim: WheelPoint[];
  rimEdges: number[][];
}

export const MIN_RIM = 5;
export const MAX_RIM = 12;

export function rimSize(firstName: string): number {
  const letters = Array.from(firstName.trim()).length;
  return Math.min(Math.max(letters, MIN_RIM), MAX_RIM);
}

export function wheelGraph(rim: number, center: WheelPoint, radius: number): WheelGraph {
  const points: WheelPoint[] = [];
  const edges: number[][] = [];
  for (let i = 0; i < rim; i++) {
    const angle = (i / rim) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: Math.round((center.x + Math.cos(angle) * radius) * 10) / 10,
      y: Math.round((center.y + Math.sin(angle) * radius) * 10) / 10,
    });
    edges.push([i, (i + 1) % rim]);
  }
  return { center: center, rim: points, rimEdges: edges };
}

export function rimLetters(firstName: string, rim: number): string[] {
  const letters = Array.from(firstName.trim().toUpperCase());
  const result: string[] = [];
  for (let i = 0; i < rim; i++) {
    result.push(i < letters.length ? letters[i] : "·");
  }
  return result;
}

export interface WheelColoring {
  center: number;
  rim: number[];
}

export function wheelColoring(rim: number): WheelColoring {
  const colors: number[] = [];
  for (let i = 0; i < rim; i++) {
    colors.push(i % 2 === 0 ? 1 : 2);
  }
  if (rim % 2 === 1) {
    colors[rim - 1] = 3;
  }
  return { center: 0, rim: colors };
}

export function chromaticNumber(rim: number): number {
  return rim % 2 === 0 ? 3 : 4;
}

// колесо при выходе из аккаунта
export function farewellFact(rim: number): string {
  return `Без центра W${rim + 1} — просто цикл C${rim}. До встречи!`;
}

function edgesWord(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return "рёбер";
  }
  if (last === 1) {
    return "ребро";
  }
  if (last >= 2 && last <= 4) {
    return "ребра";
  }
  return "рёбер";
}

export function wheelFacts(rim: number): string[] {
  const name = "W" + (rim + 1);
  const edges = rim * 2;
  return [
    name + " красится в " + chromaticNumber(rim) + " цвета — вот так",
    `У ${name} ${rim + 1} вершин и ${edges} ${edgesWord(edges)}: ${rim} спиц и обод`,
    "Колесо планарно: его можно нарисовать без пересечений рёбер",
    "В колесе есть гамильтонов цикл: обойти все вершины по разу и вернуться",
  ];
}
