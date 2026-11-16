export type { Edge, EdgeChanges, Graph, GraphColor, Vertex, VertexChanges } from "./model/types";
export {
  addEdge,
  addVertex,
  createEmptyGraph,
  findEdge,
  findVertex,
  hasEdge,
  moveVertex,
  nextVertexLabel,
  removeEdge,
  removeVertex,
  setDirected,
  updateEdge,
  updateVertex,
} from "./model/operations";
