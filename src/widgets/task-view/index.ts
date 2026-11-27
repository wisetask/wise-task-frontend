export { default as TaskCondition } from "./ui/TaskCondition.vue";
export { default as CheckResultNotice } from "./ui/CheckResultNotice.vue";
export { default as TaskGraphThumb } from "./ui/TaskGraphThumb.vue";
export { default as GraphMiniature } from "./ui/GraphMiniature.vue";
export { loadThumbGraph } from "./lib/thumbGraph";
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
  checkMarks,
  failedChecksText,
  failureSummary,
  mistakeDetail,
  mistakeText,
  toCheckResult,
  type BackendPluginResult,
  type CheckMark,
  type CheckResult,
  type Mistake,
} from "./lib/checkResult";
export { loadFullGraph, tryLoadFullGraph } from "./lib/loadGraph";
