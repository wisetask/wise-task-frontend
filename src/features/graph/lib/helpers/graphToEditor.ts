import { Color, Graph as GqlGraph } from "@/__generated__/graphql";
import {
  createCustomNode,
  CustomNode,
} from "@/features/graph/types/CustomNode";
import { createCustomEdge, CustomEdge } from "@/features/graph/types/CustomEdge";
import { useNodeStore } from "@/features/graph/stores/nodes";
import { Graph as StoreGraph } from "@/store/graph";

const COLOR_TO_HEX: Record<string, string> = {
  [Color.Red]: "#ff0000",
  [Color.Green]: "#00ff00",
  [Color.Blue]: "#0000ff",
  [Color.Gray]: "#949494",
};

const DEFAULT_COLOR = "#949494";
const FALLBACK_SPACING = 150;

const colorToHex = (color?: string | null): string =>
  COLOR_TO_HEX[(color ?? "").toUpperCase()] ?? DEFAULT_COLOR;

export interface EditorGraphState {
  nodes: CustomNode[];
  edges: CustomEdge[];
  isDirected: boolean;
  name: string;
}

export function gqlGraphToEditorState(
  graph: Pick<
    GqlGraph,
    "vertexList" | "edgeList" | "isDirect" | "name"
  >,
): EditorGraphState {
  const nodes: CustomNode[] = (graph.vertexList ?? []).map((vertex, index) => {
    const id = String(vertex?.id ?? index);
    return {
      id,
      type: "special",
      position: {
        x: vertex?.xCoordinate ?? (index % 6) * FALLBACK_SPACING,
        y: vertex?.yCoordinate ?? Math.floor(index / 6) * FALLBACK_SPACING,
      },
      data: {
        label: vertex?.label ?? "",
        weight: vertex?.weight ?? 0,
        color: colorToHex(vertex?.color),
      },
    };
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edges: CustomEdge[] = (graph.edgeList ?? []).map((edge, index) =>
    buildEdge(
      nodeById,
      `edge-${index}-${Date.now()}`,
      String(edge?.source ?? ""),
      String(edge?.target ?? ""),
      edge?.label ?? "",
      colorToHex(edge?.color),
      edge?.weight ?? 0,
    ),
  );

  return {
    nodes,
    edges,
    isDirected: graph.isDirect ?? false,
    name: graph.name ?? "",
  };
}

const stripNodePrefix = (value: unknown): string =>
  String(value ?? "").replace(/^node/, "");

const buildEdge = (
  nodeById: Map<string, CustomNode>,
  id: string,
  sourceId: string,
  targetId: string,
  label: string,
  color: string,
  weight: number,
): CustomEdge => ({
  ...createCustomEdge({
    id,
    source: sourceId,
    target: targetId,
    sourceNode: nodeById.get(sourceId) as any,
    targetNode: nodeById.get(targetId) as any,
    type: "special",
    label,
    data: {
      color,
      weight,
    },
  }),
  events: {},
});

export function vGraphToEditorState(
  graph: StoreGraph,
): EditorGraphState {
  const layouts = graph.layouts?.nodes ?? {};

  const nodes: CustomNode[] = Object.values(graph.nodes ?? {}).map(
    (node: any) => {
      const id = stripNodePrefix(node?.id);
      const layout = layouts[`node${node?.id}`] ?? layouts[node?.id];
      return {
        id,
        type: "special",
        position: {
          x: layout?.x ?? 0,
          y: layout?.y ?? 0,
        },
        data: {
          label: node?.label ?? "",
          weight: node?.weight ?? 0,
          color: colorToHex(node?.color),
        },
      };
    },
  );

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edges: CustomEdge[] = Object.values(graph.edges ?? {}).map(
    (edge: any, index: number) =>
      buildEdge(
        nodeById,
        `edge-${index}-${Date.now()}`,
        stripNodePrefix(edge?.source),
        stripNodePrefix(edge?.target),
        edge?.label ?? "",
        colorToHex(edge?.color),
        +(edge?.weight ?? 0) || 0,
      ),
  );

  return {
    nodes,
    edges,
    isDirected: graph.isDirect ?? false,
    name: graph.name ?? "",
  };
}

export function applyEditorGraphState(state: EditorGraphState): void {
  const nodeStore = useNodeStore();
  nodeStore.nodes = state.nodes;
  nodeStore.edges = state.edges;
  nodeStore.isDirected = state.isDirected;
  nodeStore.name = state.name;
  nodeStore.regenerateStatistics();
}
