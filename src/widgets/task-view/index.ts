export { default as TaskCondition } from "./ui/TaskCondition.vue";
export { default as CheckResultNotice } from "./ui/CheckResultNotice.vue";
export {
  answerStartsFromTask,
  canPickDirection,
  checkText,
  graphToLoad,
  rulesFromBackend,
  startAnswer,
  taskHints,
  toTaskView,
  type BackendCondition,
  type BackendRule,
  type BackendTask,
  type TaskCheck,
  type TaskView,
} from "./lib/taskView";
export {
  mistakeDetail,
  mistakeText,
  toCheckResult,
  type BackendPluginResult,
  type CheckResult,
  type Mistake,
} from "./lib/checkResult";
export { loadFullGraph, tryLoadFullGraph } from "./lib/loadGraph";
