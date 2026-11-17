export type { Edge, EdgeChanges, Graph, GraphColor, Vertex, VertexChanges } from "./model/types";
export {
  addEdge,
  addVertex,
  createEmptyGraph,
  findEdge,
  findVertex,
  hasEdge,
  moveVertex,
  moveVertices,
  nextVertexLabel,
  removeEdge,
  removeVertex,
  setDirected,
  updateEdge,
  updateVertex,
} from "./model/operations";
export type {
  BackendEdge,
  BackendGraph,
  BackendVertex,
  GraphInput,
  ImportedGraph,
} from "./model/backendFormat";
export { fromBackendGraph, hasFractionalWeights, toGraphInput } from "./model/backendFormat";
export type { GraphFileResult } from "./model/graphFile";
export { graphFileName, graphFromFileText, graphToFileText } from "./model/graphFile";
export type { GraphStatistics } from "./model/statistics";
export {
  countComponents,
  countEdges,
  countIsolated,
  countLeaves,
  countLoops,
  countVertices,
  graphStatistics,
  vertexDegree,
} from "./model/statistics";
