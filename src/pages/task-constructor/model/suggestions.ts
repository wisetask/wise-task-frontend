export const CATEGORY_IDEAS = [
  "Деревья",
  "Раскраска",
  "Пути",
  "Связность",
  "Эйлеровы графы",
  "Паросочетания",
  "Планарность",
];

export const DESCRIPTION_STARTS = [
  "Нарисуйте граф, в котором ",
  "Раскрасьте вершины так, чтобы ",
  "Добавьте рёбра, чтобы ",
  "Удалите как можно меньше рёбер, чтобы ",
];

export function categoryIdeas(current: string): string[] {
  const text = current.trim().toLocaleLowerCase("ru");
  const ideas: string[] = [];
  for (const idea of CATEGORY_IDEAS) {
    const lower = idea.toLocaleLowerCase("ru");
    if (lower === text) {
      continue;
    }
    if (text === "" || lower.startsWith(text)) {
      ideas.push(idea);
    }
  }
  return ideas;
}

export function withStart(description: string, start: string): string {
  const text = description.trimEnd();
  if (text === "") {
    return start;
  }
  return text + "\n" + start;
}
