import { Graph, Vertex, Edge as BackendEdge } from "@/__generated__/graphql";
import { Graph as StoreGraph } from "@/store/graph";
import { randomUUID } from "crypto";
import * as vNG from "v-network-graph";

export interface Node extends vNG.Node {
  color: string;
  label?: Label;
}

export interface Edge extends vNG.Edge {
  color: string;
  label?: Label;
}

export interface Label {
  label?: string;
  weight?: string;
}

export interface Layout {
  x: number | undefined;
  y: number | undefined;
  nodeId: number | undefined;
}

export function toVGraph(graph: Graph) {
  const nodes = {};
  const edges = {};
  const layouts = { nodes: {} };
  const generateEdgeId = generateEdgeIdFuncFactory(edges);
  graph.vertexList.forEach((node) => {
    addNode(
      {
        id: `node${node?.id}`,
        color: node?.color,
        label: node?.label,
        weight: node?.weight,
      },
      nodes,
    );
    addLayout(
      {
        x: node?.xCoordinate,
        y: node?.yCoordinate,
        nodeId: node?.id,
      },
      layouts,
    );
  });

  graph.edgeList.forEach((edge) => {
    addEdge(
      {
        id: generateEdgeId(`node${edge?.source}`, `node${edge?.target}`),
        color: edge?.color,
        label: edge?.label,
        weight: edge?.weight,
        source: `node${edge?.source}`,
        target: `node${edge?.target}`,
      },
      edges,
    );
  });
  return {
    id: graph.id,
    name: graph.name,
    isDirect: graph.isDirect,
    author: graph.author,
    edges: edges,
    nodes: nodes,
    layouts: layouts,
  };
}

export function toGraph(graph: StoreGraph): Graph {
  const vertexCount = Object.entries(graph.nodes).length;
  const edgeCount = Object.entries(graph.edges).length;
  const isDirect = graph.isDirect;
  const isNamed = !!(graph.name && graph.name.length > 1);
  const name = graph.name;
  const vertexList = new Array<Vertex>();
  const edgeList = new Array<BackendEdge>();
  Object.entries(graph.layouts).forEach(([key, layout]) => {
    Object.entries(layout).forEach(([k, nodeLayout]) => {
      const node = graph.nodes[`node${nodeLayout.nodeId}`];
      vertexList.push({
        id: +(node.id as String).substring(4),
        weight: +node.weight,
        xCoordinate: +nodeLayout.x,
        yCoordinate: +nodeLayout.y,
        color: node.color,
        label: node.label,
      });
    });
  });
  Object.entries(graph.edges).forEach(([key, edge]) => {
    edgeList.push({
      source: +(edge.source as String).substring(4),
      target: +(edge.target as String).substring(4),
      weight: edge.weight === "" ? null : +edge.weight,
      label: edge.label,
      color: edge.color,
    });
  });

  return {
    id: graph.id,
    vertexCount: vertexCount,
    edgeCount: edgeCount,
    isDirect: isDirect,
    vertexList: vertexList,
    edgeList: edgeList,
    isNamed: isNamed,
    name: name,
  };
}

export function addNode(node: Omit<Node, "name">, nodes: any) {
  const name = node.id;
  nodes[node.id] = { name, ...node } as Node;
}

export function addEdge(edge: Omit<Edge, "source" | "target">, edges: any) {
  const source = edge.source;
  const target = edge.target;
  edges[edge.id] = { source, target, ...edge } as Edge;
}

export function addLayout(layout: Layout, layouts: any) {
  const nodeId = `node${layout.nodeId}`;
  layouts.nodes[nodeId] = { ...layout };
}

export function generateEdgeIdFuncFactory(edges: vNG.Edges) {
  return (source: string, target: string) => {
    const base = `${source}=>${target}`;
    let index = 0;
    let edgeId = `${base}.${index}`;
    while (edgeId in edges) {
      index++;
      edgeId = `${base}.${index}`;
    }
    return edgeId;
  };
}
