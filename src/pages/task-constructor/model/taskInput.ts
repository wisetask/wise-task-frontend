import { toGraphInput, type GraphInput } from "@/entities/graph";
import { toPluginInfoInput, type PluginInfoInput } from "@/features/task-conditions";
import { allowEverything, type EditorRules, type GraphDirection } from "@/widgets/graph-editor";
import { graphForRules, type TaskDraft } from "./taskDraft";

export type GraphTypeInput = "DIRECT" | "UNDIRECT" | "ANY";

export interface RuleInput {
  isColor: boolean;
  isEdit: boolean;
  isMove: boolean;
  isDelete: boolean;
}

export interface TaskGraphInput {
  id?: string;
  name: string;
  description: string;
  category: string;
  taskType: "GRAPH";
  isPublic: boolean;
  isHiddenMistake: boolean;
  graph: GraphInput | null;
  rule: RuleInput;
  condition: PluginInfoInput[];
}

export function graphTypeInput(direction: GraphDirection): GraphTypeInput {
  if (direction === "directed") {
    return "DIRECT";
  }
  if (direction === "undirected") {
    return "UNDIRECT";
  }
  return "ANY";
}

export function directionFromInput(graphType: GraphTypeInput | null): GraphDirection {
  if (graphType === "DIRECT") {
    return "directed";
  }
  if (graphType === "UNDIRECT") {
    return "undirected";
  }
  return "any";
}

export function ruleInput(rules: EditorRules): RuleInput {
  return {
    isColor: rules.canColor,
    isEdit: rules.canAdd && rules.canEditLabels,
    isMove: rules.canMove,
    isDelete: rules.canDelete,
  };
}

export function rulesFromInput(rule: RuleInput, graphType: GraphTypeInput | null): EditorRules {
  return {
    canAdd: rule.isEdit,
    canDelete: rule.isDelete,
    canEditLabels: rule.isEdit,
    canColor: rule.isColor,
    canMove: rule.isMove,
    direction: directionFromInput(graphType),
  };
}

export function toTaskGraphInput(draft: TaskDraft): TaskGraphInput {
  let graph: GraphInput | null = null;
  let rule = ruleInput(allowEverything());
  if (draft.hasGraph) {
    graph = toGraphInput(graphForRules(draft.graph, draft.rules), null);
    rule = ruleInput(draft.rules);
  }
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    taskType: "GRAPH",
    isPublic: draft.isPublic,
    isHiddenMistake: false,
    graph: graph,
    rule: rule,
    condition: toPluginInfoInput(draft.conditions),
  };
}
