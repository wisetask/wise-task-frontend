import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { conditionError, type TaskCondition } from "@/features/task-conditions";
import {
  allowEverything,
  directedByRules,
  rulesSummary,
  withDirection,
  type EditorRules,
} from "@/widgets/graph-editor";

export type ConstructorTab = "main" | "graph" | "conditions" | "student";

export interface TabOption {
  id: ConstructorTab;
  title: string;
}

export interface TaskDraft {
  name: string;
  category: string;
  description: string;
  isPublic: boolean;
  hasGraph: boolean;
  graph: Graph;
  rules: EditorRules;
  conditions: TaskCondition[];
}

export function createTaskDraft(): TaskDraft {
  return {
    name: "",
    category: "",
    description: "",
    isPublic: false,
    hasGraph: false,
    graph: createEmptyGraph(false),
    rules: allowEverything(),
    conditions: [],
  };
}

export function draftTabs(draft: TaskDraft): TabOption[] {
  const tabs: TabOption[] = [{ id: "main", title: "Основное" }];
  if (draft.hasGraph) {
    tabs.push({ id: "graph", title: "Граф" });
  }
  const checks = pluralize(draft.conditions.length, "проверка", "проверки", "проверок");
  tabs.push({ id: "conditions", title: "Условия (" + checks + ")" });
  tabs.push({ id: "student", title: "Как увидит студент" });
  return tabs;
}

export interface ReadinessItem {
  text: string;
  isDone: boolean;
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return count + " " + many;
  }
  if (last === 1) {
    return count + " " + one;
  }
  if (last >= 2 && last <= 4) {
    return count + " " + few;
  }
  return count + " " + many;
}

export function draftReadiness(draft: TaskDraft): ReadinessItem[] {
  const items: ReadinessItem[] = [];
  if (draft.name.trim() === "") {
    items.push({ text: "Введите название задачи", isDone: false });
  } else {
    items.push({ text: "Название", isDone: true });
  }
  if (draft.category.trim() === "") {
    items.push({ text: "Введите категорию", isDone: false });
  } else {
    items.push({ text: "Категория", isDone: true });
  }
  if (draft.description.trim() === "") {
    items.push({ text: "Опишите, что нужно сделать студенту", isDone: false });
  } else {
    items.push({ text: "Описание", isDone: true });
  }
  if (draft.hasGraph) {
    const vertexCount = draft.graph.vertices.length;
    if (vertexCount === 0) {
      items.push({
        text: "Нарисуйте граф на вкладке «Граф» или снимите галочку «Граф задан»",
        isDone: false,
      });
    } else {
      const vertices = pluralize(vertexCount, "вершина", "вершины", "вершин");
      const edges = pluralize(draft.graph.edges.length, "ребро", "ребра", "рёбер");
      items.push({ text: "Граф: " + vertices + ", " + edges, isDone: true });
    }
  }
  const conditionCount = draft.conditions.length;
  if (conditionCount === 0) {
    items.push({
      text: "Добавьте хотя бы одну проверку на вкладке «Условия»",
      isDone: false,
    });
  } else {
    let conditionNumber = 1;
    for (const condition of draft.conditions) {
      if (conditionError(condition) !== "") {
        items.push({ text: "Исправьте проверку " + conditionNumber, isDone: false });
        break;
      }
      conditionNumber++;
    }
    if (conditionNumber > conditionCount) {
      items.push({ text: "Проверки: " + conditionCount, isDone: true });
    }
  }
  return items;
}

export function draftProblems(draft: TaskDraft): string[] {
  const problems: string[] = [];
  for (const item of draftReadiness(draft)) {
    if (!item.isDone) {
      problems.push(item.text);
    }
  }
  return problems;
}

export function graphForRules(graph: Graph, rules: EditorRules): Graph {
  const directed = directedByRules(rules);
  if (directed === null || directed === graph.isDirected) {
    return graph;
  }
  return setDirected(graph, directed);
}

export function studentRules(draft: TaskDraft): EditorRules {
  if (draft.hasGraph) {
    return draft.rules;
  }
  return withDirection(allowEverything(), draft.rules.direction);
}

export function taskGraph(draft: TaskDraft): Graph | null {
  if (!draft.hasGraph) {
    return null;
  }
  return graphForRules(draft.graph, draft.rules);
}

export function answerStartsFromTask(draft: TaskDraft): boolean {
  return draft.hasGraph;
}

export function studentStartGraph(draft: TaskDraft): Graph {
  if (answerStartsFromTask(draft)) {
    return graphForRules(draft.graph, draft.rules);
  }
  return createEmptyGraph(draft.rules.direction === "directed");
}

export function canPickAnswerDirection(draft: TaskDraft): boolean {
  return !answerStartsFromTask(draft) && draft.rules.direction === "any";
}

export function studentHints(draft: TaskDraft): string[] {
  const hints: string[] = [];
  if (!draft.hasGraph) {
    hints.push("Граф студент рисует сам.");
  } else {
    hints.push("Ответ начинается с копии графа задачи.");
  }
  if (draft.rules.direction === "directed") {
    hints.push("Граф в ответе может быть только ориентированным.");
  } else if (draft.rules.direction === "undirected") {
    hints.push("Граф в ответе может быть только неориентированным.");
  }
  if (draft.hasGraph) {
    const summary = rulesSummary(draft.rules);
    if (summary !== "") {
      hints.push(summary);
    }
  }
  return hints;
}
