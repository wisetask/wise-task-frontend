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
