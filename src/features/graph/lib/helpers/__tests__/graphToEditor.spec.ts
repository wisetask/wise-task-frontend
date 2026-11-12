import { createPinia, setActivePinia } from "pinia";
import { Position } from "@vue-flow/core";
import { Color } from "@/__generated__/graphql";
import {
  ConnectionSourceID,
  ConnectionTargetID,
} from "@/features/graph/types/CustomEdge";

import type {
  gqlGraphToEditorState as GqlGraphToEditorState,
  vGraphToEditorState as VGraphToEditorState,
} from "../graphToEditor";

let gqlGraphToEditorState: typeof GqlGraphToEditorState;
let vGraphToEditorState: typeof VGraphToEditorState;

beforeAll(async () => {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
  };
  setActivePinia(createPinia());
  const mod = await import("../graphToEditor");
  gqlGraphToEditorState = mod.gqlGraphToEditorState;
  vGraphToEditorState = mod.vGraphToEditorState;
});

describe("gqlGraphToEditorState", () => {
  it("maps vertices and edges with direct source/target", () => {
    const state = gqlGraphToEditorState({
      vertexList: [
        {
          id: 1,
          label: "A",
          weight: 3,
          color: Color.Red,
          xCoordinate: 10,
          yCoordinate: 20,
        },
        {
          id: 2,
          label: "B",
          weight: 0,
          color: Color.Gray,
          xCoordinate: 100,
          yCoordinate: 200,
        },
      ],
      edgeList: [
        {
          source: 2,
          target: 1,
          label: "e1",
          weight: 7,
          color: Color.Blue,
        },
      ],
      isDirect: true,
      name: "Test",
    });

    expect(state.isDirected).toBe(true);
    expect(state.name).toBe("Test");
    expect(state.nodes).toEqual([
      {
        id: "1",
        type: "special",
        position: { x: 10, y: 20 },
        data: { label: "A", weight: 3, color: "#ff0000" },
      },
      {
        id: "2",
        type: "special",
        position: { x: 100, y: 200 },
        data: { label: "B", weight: 0, color: "#949494" },
      },
    ]);
    expect(state.edges).toHaveLength(1);
    expect(state.edges[0].source).toBe("2");
    expect(state.edges[0].target).toBe("1");
    expect(state.edges[0].label).toBe("e1");
    expect(state.edges[0].data).toEqual({
      color: "#0000ff",
      weight: 7,
    });
    expect(state.edges[0].type).toBe("special");
    expect(state.edges[0].sourceHandle).toBe(ConnectionSourceID.Top);
    expect(state.edges[0].targetHandle).toBe(ConnectionTargetID.Bottom);
    expect(state.edges[0].sourcePosition).toBe(Position.Top);
    expect(state.edges[0].targetPosition).toBe(Position.Bottom);
  });

  it("places nodes on a grid when coordinates are missing", () => {
    const state = gqlGraphToEditorState({
      vertexList: [{ id: 1, label: "", weight: 0, color: Color.Gray, xCoordinate: 0, yCoordinate: 0 }],
      edgeList: [],
      isDirect: false,
      name: "",
    });

    expect(state.nodes[0].position).toEqual({ x: 0, y: 0 });
  });
});

describe("vGraphToEditorState", () => {
  it("converts store graph with nodeN keys", () => {
    const state = vGraphToEditorState({
      id: "graph-1",
      name: "Lib",
      isDirect: true,
      nodes: {
        node1: { id: "node1", label: "x", weight: 1, color: "GREEN" },
        node2: { id: "node2", label: "y", weight: 0, color: "GRAY" },
      },
      edges: {
        "node1=>node2.0": {
          id: "node1=>node2.0",
          source: "node1",
          target: "node2",
          label: "l",
          weight: "4",
          color: "RED",
        },
      },
      layouts: {
        nodes: {
          node1: { x: 5, y: 6, nodeId: 1 },
          node2: { x: 50, y: 60, nodeId: 2 },
        },
      },
    } as any);

    expect(state.isDirected).toBe(true);
    expect(state.name).toBe("Lib");
    expect(state.nodes).toEqual([
      {
        id: "1",
        type: "special",
        position: { x: 5, y: 6 },
        data: { label: "x", weight: 1, color: "#00ff00" },
      },
      {
        id: "2",
        type: "special",
        position: { x: 50, y: 60 },
        data: { label: "y", weight: 0, color: "#949494" },
      },
    ]);
    expect(state.edges[0].source).toBe("1");
    expect(state.edges[0].target).toBe("2");
    expect(state.edges[0].sourceHandle).toBe(ConnectionSourceID.Bottom);
    expect(state.edges[0].targetHandle).toBe(ConnectionTargetID.Top);
  });

  it("builds self-loop edges with opposite side handles", () => {
    const state = gqlGraphToEditorState({
      vertexList: [
        { id: 1, label: "A", weight: 0, color: Color.Gray, xCoordinate: 0, yCoordinate: 0 },
      ],
      edgeList: [
        { source: 1, target: 1, label: "", weight: 0, color: Color.Gray },
      ],
      isDirect: true,
      name: "",
    });

    expect(state.edges[0].source).toBe("1");
    expect(state.edges[0].target).toBe("1");
    expect(state.edges[0].sourceHandle).toBe(ConnectionSourceID.Right);
    expect(state.edges[0].targetHandle).toBe(ConnectionTargetID.Left);
  });
});
