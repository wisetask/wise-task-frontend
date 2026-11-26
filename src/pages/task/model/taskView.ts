import {
  createEmptyGraph,
  fromBackendGraph,
  type BackendGraph,
  type Graph,
} from "@/entities/graph";
import { allowEverything, rulesSummary, type EditorRules } from "@/widgets/graph-editor";

export interface BackendRule {
  isColor: boolean;
  isEdit: boolean;
  isMove: boolean;
  isDelete: boolean;
}

export interface BackendCondition {
  plugin?: { id: string; name: string } | null;
  value: string;
  mistakeText?: string | null;
  sign?: string | null;
  pluginType: string;
}

export interface BackendTask {
  __typename?: string;
  id: string;
  name: string;
  description: string;
  category: string;
  author?: { firstName: string; lastName: string } | null;
  isHiddenMistake?: boolean;
  rule?: BackendRule;
  graph?: BackendGraph | null;
  conditions?: BackendCondition[] | null;
}

export interface TaskCheck {
  pluginId: string;
  text: string;
  mistakeText: string;
}

export interface TaskView {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  isHiddenMistake: boolean;
  graph: Graph | null;
  skippedEdges: number;
  rules: EditorRules;
  checks: TaskCheck[];
}

export function rulesFromBackend(rule: BackendRule | undefined): EditorRules {
  if (rule === undefined) {
    return allowEverything();
  }
  return {
    canAdd: rule.isEdit,
    canDelete: rule.isDelete,
    canEditLabels: rule.isEdit,
    canColor: rule.isColor,
    canMove: rule.isMove,
    direction: "any",
  };
}

export function checkText(condition: BackendCondition): string {
  let name = "Проверка";
  if (condition.plugin) {
    name = condition.plugin.name;
  }
  if (condition.pluginType === "GRAPH_PROPERTY" && condition.value === "false") {
    return name + " — не выполняется";
  }
  if (condition.pluginType === "GRAPH_CHARACTERISTIC" && condition.sign) {
    return name + " " + condition.sign + " " + condition.value;
  }
  return name;
}

export function graphToLoad(task: BackendTask): string | null {
  if (task.__typename !== "TaskGraph" || !task.graph) {
    return null;
  }
  if (task.graph.vertexList.length > 0 || !task.graph.id) {
    return null;
  }
  return task.graph.id;
}

export function toTaskView(
  task: BackendTask,
  loadedGraph: BackendGraph | null = null,
): TaskView | null {
  if (task.__typename !== "TaskGraph") {
    return null;
  }
  let backendGraph: BackendGraph | null = null;
  if (loadedGraph !== null) {
    backendGraph = loadedGraph;
  } else if (task.graph) {
    backendGraph = task.graph;
  }
  let graph: Graph | null = null;
  let skippedEdges = 0;
  if (backendGraph !== null) {
    const imported = fromBackendGraph(backendGraph);
    graph = imported.graph;
    skippedEdges = imported.skippedEdges;
  }
  const checks: TaskCheck[] = [];
  for (const condition of task.conditions ?? []) {
    let pluginId = "";
    if (condition.plugin) {
      pluginId = condition.plugin.id;
    }
    checks.push({
      pluginId: pluginId,
      text: checkText(condition),
      mistakeText: condition.mistakeText ?? "",
    });
  }
  let author = "";
  if (task.author) {
    author = (task.author.lastName + " " + task.author.firstName).trim();
  }
  return {
    id: task.id,
    name: task.name,
    category: task.category,
    description: task.description,
    author: author,
    isHiddenMistake: task.isHiddenMistake === true,
    graph: graph,
    skippedEdges: skippedEdges,
    rules: rulesFromBackend(task.rule),
    checks: checks,
  };
}

export function answerStartsFromTask(view: TaskView): boolean {
  return view.graph !== null && !view.rules.canAdd;
}

export function startAnswer(view: TaskView): Graph {
  if (view.graph !== null && answerStartsFromTask(view)) {
    return view.graph;
  }
  let isDirected = false;
  if (view.graph !== null) {
    isDirected = view.graph.isDirected;
  }
  return createEmptyGraph(isDirected);
}

export function canPickDirection(view: TaskView): boolean {
  return !answerStartsFromTask(view);
}

export function taskHints(view: TaskView): string[] {
  const hints: string[] = [];
  if (view.graph === null) {
    hints.push("Граф нарисуйте сами.");
  } else if (answerStartsFromTask(view)) {
    hints.push("Ответ начинается с копии графа задачи.");
  } else {
    hints.push("Постройте ответ на пустом поле, граф задачи остаётся в условии.");
  }
  if (view.graph !== null) {
    const summary = rulesSummary(view.rules);
    if (summary !== "") {
      hints.push(summary);
    }
  }
  return hints;
}
