import { createEmptyGraph, setDirected, type Graph } from "@/entities/graph";
import { allowEverything, directedByRules, type EditorRules } from "@/widgets/graph-editor";

export type ConstructorTab = "main" | "graph" | "conditions";

export interface TabOption {
  id: ConstructorTab;
  title: string;
}

export interface TaskDraft {
  name: string;
  category: string;
  description: string;
  isPublic: boolean;
  isHiddenMistake: boolean;
  hasGraph: boolean;
  graph: Graph;
  rules: EditorRules;
}

export function createTaskDraft(): TaskDraft {
  return {
    name: "",
    category: "",
    description: "",
    isPublic: false,
    isHiddenMistake: false,
    hasGraph: false,
    graph: createEmptyGraph(false),
    rules: allowEverything(),
  };
}

export function draftTabs(draft: TaskDraft): TabOption[] {
  const tabs: TabOption[] = [{ id: "main", title: "Основное" }];
  if (draft.hasGraph) {
    tabs.push({ id: "graph", title: "Граф" });
  }
  tabs.push({ id: "conditions", title: "Условия" });
  return tabs;
}

export function draftProblems(draft: TaskDraft): string[] {
  const problems: string[] = [];
  if (draft.name.trim() === "") {
    problems.push("Введите название задачи");
  }
  if (draft.category.trim() === "") {
    problems.push("Введите категорию");
  }
  if (draft.description.trim() === "") {
    problems.push("Опишите, что нужно сделать студенту");
  }
  if (draft.hasGraph && draft.graph.vertices.length === 0) {
    problems.push("Нарисуйте граф на вкладке «Граф» или снимите галочку «Граф задан»");
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
