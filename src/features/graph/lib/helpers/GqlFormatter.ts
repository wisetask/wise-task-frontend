import {
  Color,
  EdgeInput,
  Graph,
  InputMaybe,
  Vertex,
} from "@/__generated__/graphql";
import { CustomEdge } from "@/features/graph/types/CustomEdge";
import { CustomNode } from "@/features/graph/types/CustomNode";
import { NodesStoreState } from "@/features/graph/types/NodesStore";

export const generateEdgesList = (
  edges: CustomEdge[],
  nodeIdMap: Map<string, number>,
): Array<InputMaybe<EdgeInput>> => {
  const edgeList: Array<InputMaybe<EdgeInput>> = [];

  for (let edge of edges) {
    const color: Color = (() => {
      if (!edge.data || !edge.data.color) {
        return Color.Gray;
      }
      if (edge.data.color.toUpperCase() === "#FF0000") {
        return Color.Red;
      }
      if (edge.data.color.toUpperCase() === "#00FF00") {
        return Color.Green;
      }
      if (edge.data.color.toUpperCase() === "#0000FF") {
        return Color.Blue;
      }
      return Color.Gray;
    })();

    const sourceId = nodeIdMap.get(edge.source);
    const targetId = nodeIdMap.get(edge.target);

    if (sourceId !== undefined && targetId !== undefined) {
      edgeList.push({
        color: color,
        label: edge.label || "",
        source: sourceId,
        target: targetId,
        weight: +(edge.data?.weight || "") || 0,
      });
    }
  }

  return edgeList;
};

export const generateNodesList = (
  nodes: CustomNode[],
): { vertexList: Vertex[]; idMap: Map<string, number> } => {
  const vertexList: Vertex[] = [];
  const idMap = new Map<string, number>();

  const sortedNodes = [...nodes].sort(
    (a, b) => parseInt(a.id) - parseInt(b.id),
  );

  let newId = 1;
  for (let node of sortedNodes) {
    const color: Color = (() => {
      if (!node.data || !node.data.color) {
        return Color.Gray;
      }
      if (node.data.color.toLowerCase() === "red") {
        return Color.Red;
      }
      if (node.data.color.toLowerCase() === "green") {
        return Color.Green;
      }
      if (node.data.color.toLowerCase() === "blue") {
        return Color.Blue;
      }
      return Color.Gray;
    })();

    idMap.set(node.id, newId);

    vertexList.push({
      color: color,
      id: newId,
      label: node.data.label || "",
      weight: node.data.weight || 0,
      xCoordinate: Math.floor(node.position.x),
      yCoordinate: Math.floor(node.position.y),
    });

    newId++;
  }

  return { vertexList, idMap };
};

export const convertToGqlFormat = (graphState: NodesStoreState): Graph => {
  const { vertexList, idMap } = generateNodesList(graphState.nodes);
  const edgeList = generateEdgesList(graphState.edges, idMap);
  const id =
    typeof self !== "undefined" && self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : require("crypto").randomUUID();

  return {
    edgeCount: edgeList.length,
    edgeList: edgeList,
    id,
    isDirect: graphState.isDirected,
    isNamed: graphState.name.length > 0,
    name: graphState.name || undefined,
    vertexCount: vertexList.length,
    vertexList: vertexList,
  };
};
