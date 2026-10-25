import {
  convertToGqlFormat,
  generateEdgesList,
  generateNodesList,
} from "../GqlFormatter";
import { createCustomEdge } from "@/features/graph/types/CustomEdge";
import { Color, EdgeInput } from "@/__generated__/graphql";
import {
  createCustomNode,
  CustomNode,
} from "@/features/graph/types/CustomNode";
import { GraphNode } from "@vue-flow/core";
import { NodesStoreState } from "@/features/graph/types/NodesStore";

const createNode = (id: string): GraphNode =>
  createCustomNode(id, { x: 0, y: 0 }) as GraphNode;

const makeEdge = (
  sourceId: string,
  targetId: string,
  data?: { color?: string; weight?: number },
  label = "",
) =>
  createCustomEdge({
    label,
    data,
    sourceNode: createNode(sourceId),
    targetNode: createNode(targetId),
  });

const baseEdge = {
  color: Color.Red,
  label: "",
  source: 1,
  target: 2,
  weight: 0,
};

const nodesMap = new Map([
  ["1", 1],
  ["2", 2],
  ["3", 3],
]);

type EdgeTestCase = {
  name: string;
  edges: ReturnType<typeof makeEdge>[];
  nodesMap: Map<string, number>;
  expected: EdgeInput[];
};

const edgeTestCases: EdgeTestCase[] = [
  {
    name: "returns empty array for empty edges and empty map",
    edges: [],
    nodesMap: new Map(),
    expected: [],
  },
  {
    name: "returns empty array when nodes map is empty",
    edges: [makeEdge("1", "2", { color: "#ff0000", weight: 0 })],
    nodesMap: new Map(),
    expected: [],
  },
  {
    name: "returns empty array for unknown color",
    edges: [makeEdge("1", "2", { color: "RANDOM COLOR", weight: 0 })],
    nodesMap: new Map(),
    expected: [],
  },
  {
    name: "converts a single edge correctly",
    edges: [makeEdge("1", "2", { color: "#ff0000", weight: 0 })],
    nodesMap,
    expected: [baseEdge],
  },
  {
    name: "handles edge with custom properties",
    edges: [makeEdge("2", "3", { color: "#00ff00", weight: 5 }, "test-label")],
    nodesMap,
    expected: [
      {
        color: Color.Green,
        label: "test-label",
        source: 2,
        target: 3,
        weight: 5,
      },
    ],
  },
  {
    name: "filters edges with missing target node",
    edges: [
      makeEdge("1", "2", { color: "#ff0000", weight: 0 }),
      makeEdge("1", "99", { color: "#0000ff", weight: 1 }, "missing"),
    ],
    nodesMap,
    expected: [baseEdge],
  },
  {
    name: "handles multiple edges",
    edges: [
      makeEdge("1", "2", { color: "#ff0000", weight: 1 }, "edge1"),
      makeEdge("2", "3", { color: "#00ff00", weight: 2 }, "edge2"),
    ],
    nodesMap,
    expected: [
      { ...baseEdge, label: "edge1", weight: 1 },
      {
        ...baseEdge,
        color: Color.Green,
        label: "edge2",
        source: 2,
        target: 3,
        weight: 2,
      },
    ],
  },
  {
    name: "handles edge without data (uses defaults)",
    edges: [makeEdge("1", "2", undefined)],
    nodesMap,
    expected: [
      {
        ...baseEdge,
        color: Color.Gray,
        weight: 0,
      },
    ],
  },
];

type NodeTestCase = {
  name: string;
  nodes: CustomNode[];
  expected: {
    vertexList: {
      id: number;
      label: string;
      weight: number;
      xCoordinate: number;
      yCoordinate: number;
      color: string;
    }[];
    idMap: Map<string, number>;
  };
};

const baseVertex = {
  weight: 0,
  xCoordinate: 1,
  yCoordinate: 2,
};

const nodeTestCases: NodeTestCase[] = [
  {
    name: "returns empty result for empty nodes array",
    nodes: [],
    expected: { vertexList: [], idMap: new Map() },
  },
  {
    name: "processes a single node with label and color",
    nodes: [
      createCustomNode("11", { x: 1, y: 2 }, { label: "123", color: "RED" }),
    ],
    expected: {
      vertexList: [
        {
          id: 1,
          label: "123",
          color: "RED",
          ...baseVertex,
        },
      ],
      idMap: new Map([["11", 1]]),
    },
  },
  {
    name: "assigns default and specified colors correctly for multiple nodes",
    nodes: [
      createCustomNode("5", { x: 1, y: 2 }),
      createCustomNode("4", { x: 1, y: 2 }, { color: "blue" }),
      createCustomNode("3", { x: 1, y: 2 }, { color: "red" }),
      createCustomNode("2", { x: 1, y: 2 }, { color: "green" }),
      createCustomNode("1", { x: 1, y: 2 }, { color: "RANDOM" }),
    ],
    expected: {
      vertexList: [
        { id: 1, label: "", color: "GRAY", ...baseVertex },
        { id: 2, label: "", color: "GREEN", ...baseVertex },
        { id: 3, label: "", color: "RED", ...baseVertex },
        { id: 4, label: "", color: "BLUE", ...baseVertex },
        { id: 5, label: "", color: "GRAY", ...baseVertex },
      ],
      idMap: new Map([
        ["1", 1],
        ["2", 2],
        ["3", 3],
        ["4", 4],
        ["5", 5],
      ]),
    },
  },
];

const convertToGqlFormatTestCases = [
  {
    name: "converts empty graph correctly",
    graphState: {
      nodes: [],
      edges: [],
      isDirected: false,
      name: "",
    },
    expected: {
      edgeCount: 0,
      vertexCount: 0,
      edgeList: [],
      vertexList: [],
      isDirect: false,
      isNamed: false,
      name: undefined,
    },
  },
  {
    name: "converts graph with nodes and edges correctly",
    graphState: {
      nodes: [
        createCustomNode(
          "1",
          { x: 1, y: 2 },
          { label: "Node 1", color: "RED" },
        ),
        createCustomNode(
          "2",
          { x: 3, y: 4 },
          { label: "Node 2", color: "GREEN" },
        ),
      ],
      edges: [
        createCustomEdge({
          sourceNode: createCustomNode("1", { x: 1, y: 2 }) as GraphNode,
          targetNode: createCustomNode("2", { x: 3, y: 4 }) as GraphNode,
          data: { color: "#ff0000", weight: 1 },
          label: "edge-label",
        }),
      ],
      isDirected: true,
      name: "TestGraph",
    },
    expected: {
      vertexCount: 2,
      edgeCount: 1,
      isDirect: true,
      isNamed: true,
      name: "TestGraph",
    },
  },
  {
    name: "sets isNamed false and name undefined when graphState.name is empty",
    graphState: {
      nodes: [],
      edges: [],
      isDirected: true,
      name: "",
    },
    expected: {
      isNamed: false,
      name: undefined,
    },
  },
];

describe("generateEdgesList", () => {
  it.each(edgeTestCases)("$name", ({ edges, nodesMap, expected }) => {
    expect(generateEdgesList(edges, nodesMap)).toEqual(expected);
  });
});

describe("generateNodesList", () => {
  it.each(nodeTestCases)("$name", ({ nodes, expected }) => {
    expect(generateNodesList(nodes)).toEqual(expected);
  });
});

describe("convertToGqlFormat", () => {
  it.each(convertToGqlFormatTestCases)("$name", ({ graphState, expected }) => {
    const result = convertToGqlFormat(graphState as NodesStoreState);

    expect(result.edgeCount).toBe(expected.edgeCount ?? result.edgeCount);
    expect(result.vertexCount).toBe(expected.vertexCount ?? result.vertexCount);
    expect(result.isDirect).toBe(expected.isDirect ?? result.isDirect);
    expect(result.isNamed).toBe(expected.isNamed ?? result.isNamed);
    expect(result.name).toBe(expected.name ?? result.name);
    expect(typeof result.id).toBe("string");
  });
});
