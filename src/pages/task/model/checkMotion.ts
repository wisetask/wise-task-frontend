export interface Spark {
  dx: number;
  dy: number;
  delay: number;
  color: number;
  size: number;
}

export const SPARK_COLORS = 4;

export const SUCCESS_TITLES = ["Верно!", "В точку!", "Граф сошёлся!"];

export const REPEAT_JOKES = [
  "Граф тот же — и ответ тот же. Попробуйте что-нибудь поменять.",
  "Проверка не устала, просто граф не изменился 🙂",
  "Если нажимать сильнее, ответ всё равно не поменяется.",
  "Вершины переглянулись и промолчали.",
];

export const EMPTY_GRAPH_NOTE = "Пустой граф — смелое решение, но, похоже, не то.";

export function burstSparks(count: number): Spark[] {
  const sparks: Spark[] = [];
  for (let index = 0; index < count; index++) {
    const angle = Math.PI + (Math.PI * (index + 0.5)) / count;
    const distance = 70 + ((index * 37) % 60);
    sparks.push({
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance),
      delay: (index % 4) * 40,
      color: index % SPARK_COLORS,
      size: 6 + (index % 3) * 2,
    });
  }
  return sparks;
}

export function successTitle(count: number): string {
  return SUCCESS_TITLES[count % SUCCESS_TITLES.length];
}

export function repeatJoke(count: number): string {
  if (count < 1) {
    return "";
  }
  return REPEAT_JOKES[(count - 1) % REPEAT_JOKES.length];
}

export function emptyGraphNote(vertexCount: number): string {
  if (vertexCount === 0) {
    return EMPTY_GRAPH_NOTE;
  }
  return "";
}
