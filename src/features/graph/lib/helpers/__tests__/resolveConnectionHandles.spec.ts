import { createPinia, setActivePinia } from "pinia";
import { Position } from "@vue-flow/core";
import {
  ConnectionSourceID,
  ConnectionTargetID,
} from "@/features/graph/types/CustomEdge";

import type {
  computePreferredHandles as ComputePreferredHandles,
  isValidSelfLoopConnection as IsValidSelfLoopConnection,
  normalizeConnectionHandles as NormalizeConnectionHandles,
  resolveConnectionHandles as ResolveConnectionHandles,
} from "../resolveConnectionHandles";

let resolveConnectionHandles: typeof ResolveConnectionHandles;
let computePreferredHandles: typeof ComputePreferredHandles;
let normalizeConnectionHandles: typeof NormalizeConnectionHandles;
let isValidSelfLoopConnection: typeof IsValidSelfLoopConnection;
let graphSettingsStore: any;

beforeAll(async () => {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
  };
  setActivePinia(createPinia());
  const mod = await import("../resolveConnectionHandles");
  resolveConnectionHandles = mod.resolveConnectionHandles;
  computePreferredHandles = mod.computePreferredHandles;
  normalizeConnectionHandles = mod.normalizeConnectionHandles;
  isValidSelfLoopConnection = mod.isValidSelfLoopConnection;
  const settingsMod = await import("@/features/graph/stores/graphSettings");
  graphSettingsStore = settingsMod.graphSettingsStore;
});

const makeNode = (id: string, x: number, y: number) => ({
  id,
  computedPosition: { x, y },
  dimensions: { width: 100, height: 100 },
});

describe("normalizeConnectionHandles", () => {
  it("keeps correctly typed handles", () => {
    const normalized = normalizeConnectionHandles({
      source: "1",
      target: "2",
      sourceHandle: ConnectionSourceID.Right,
      targetHandle: ConnectionTargetID.Left,
    } as any);

    expect(normalized.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(normalized.targetHandle).toBe(ConnectionTargetID.Left);
  });

  it("maps cross-typed handle ids to the same side", () => {
    const normalized = normalizeConnectionHandles({
      source: "1",
      target: "2",
      sourceHandle: ConnectionTargetID.Top,
      targetHandle: ConnectionSourceID.Bottom,
    } as any);

    expect(normalized.sourceHandle).toBe(ConnectionSourceID.Top);
    expect(normalized.targetHandle).toBe(ConnectionTargetID.Bottom);
  });

  it("leaves center and missing handles untouched", () => {
    const normalized = normalizeConnectionHandles({
      source: "1",
      target: "2",
      sourceHandle: ConnectionSourceID.Center,
    } as any);

    expect(normalized.sourceHandle).toBe(ConnectionSourceID.Center);
    expect(normalized.targetHandle).toBeUndefined();
  });
});

describe("isValidSelfLoopConnection", () => {
  it("allows opposite sides", () => {
    expect(
      isValidSelfLoopConnection({
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Right,
        targetHandle: ConnectionTargetID.Left,
      } as any),
    ).toBe(true);

    expect(
      isValidSelfLoopConnection({
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Top,
        targetHandle: ConnectionTargetID.Bottom,
      } as any),
    ).toBe(true);
  });

  it("allows cross-typed ids on opposite sides", () => {
    expect(
      isValidSelfLoopConnection({
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Right,
        targetHandle: ConnectionSourceID.Left,
      } as any),
    ).toBe(true);
  });

  it("rejects adjacent and same sides", () => {
    expect(
      isValidSelfLoopConnection({
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Right,
        targetHandle: ConnectionTargetID.Top,
      } as any),
    ).toBe(false);

    expect(
      isValidSelfLoopConnection({
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Right,
        targetHandle: ConnectionTargetID.Right,
      } as any),
    ).toBe(false);
  });
});

describe("computePreferredHandles", () => {
  it("uses horizontal sides for horizontal layout", () => {
    const handles = computePreferredHandles(makeNode("1", 0, 0), makeNode("2", 200, 0));

    expect(handles.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(handles.targetHandle).toBe(ConnectionTargetID.Left);
    expect(handles.sourcePosition).toBe(Position.Right);
    expect(handles.targetPosition).toBe(Position.Left);
  });

  it("uses vertical sides for vertical layout", () => {
    const handles = computePreferredHandles(makeNode("1", 0, 0), makeNode("2", 0, 200));

    expect(handles.sourceHandle).toBe(ConnectionSourceID.Bottom);
    expect(handles.targetHandle).toBe(ConnectionTargetID.Top);
  });

  it("reverses sides for backward edges", () => {
    const handles = computePreferredHandles(makeNode("1", 200, 0), makeNode("2", 0, 0));

    expect(handles.sourceHandle).toBe(ConnectionSourceID.Left);
    expect(handles.targetHandle).toBe(ConnectionTargetID.Right);
  });

  it("falls back to right-left pair for self loops", () => {
    const handles = computePreferredHandles(makeNode("1", 0, 0), makeNode("1", 0, 0));

    expect(handles.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(handles.targetHandle).toBe(ConnectionTargetID.Left);
  });

  it("works with plain nodes without computed position", () => {
    const handles = computePreferredHandles(
      { id: "1", position: { x: 0, y: 0 }, data: { size: { width: 100, height: 100 } } },
      { id: "2", position: { x: 300, y: 20 }, data: { size: { width: 100, height: 100 } } },
    );

    expect(handles.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(handles.targetHandle).toBe(ConnectionTargetID.Left);
  });
});

describe("resolveConnectionHandles", () => {
  afterEach(() => {
    graphSettingsStore.isOneHandle = false;
  });

  it("keeps explicit handles in multi-handle mode", () => {
    const resolved = resolveConnectionHandles(
      {
        source: "1",
        target: "2",
        sourceHandle: ConnectionSourceID.Top,
        targetHandle: ConnectionTargetID.Bottom,
      } as any,
      makeNode("1", 0, 0) as any,
      makeNode("2", 200, 0) as any,
    );

    expect(resolved.sourceHandle).toBe(ConnectionSourceID.Top);
    expect(resolved.targetHandle).toBe(ConnectionTargetID.Bottom);
  });

  it("normalizes dirty handles in multi-handle mode", () => {
    const resolved = resolveConnectionHandles(
      {
        source: "1",
        target: "2",
        sourceHandle: ConnectionSourceID.Right,
        targetHandle: ConnectionSourceID.Left,
      } as any,
      makeNode("1", 0, 0) as any,
      makeNode("2", 200, 0) as any,
    );

    expect(resolved.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(resolved.targetHandle).toBe(ConnectionTargetID.Left);
  });

  it("resolves missing handles by geometry", () => {
    const resolved = resolveConnectionHandles(
      { source: "1", target: "2" } as any,
      makeNode("1", 0, 0) as any,
      makeNode("2", 200, 0) as any,
    );

    expect(resolved.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(resolved.targetHandle).toBe(ConnectionTargetID.Left);
  });

  it("uses preferred handles in one-handle mode", () => {
    graphSettingsStore.isOneHandle = true;

    const resolved = resolveConnectionHandles(
      {
        source: "1",
        target: "2",
        sourceHandle: ConnectionSourceID.Center,
        targetHandle: ConnectionSourceID.Center,
      } as any,
      makeNode("1", 0, 0) as any,
      makeNode("2", 0, 200) as any,
    );

    expect(resolved.sourceHandle).toBe(ConnectionSourceID.Bottom);
    expect(resolved.targetHandle).toBe(ConnectionTargetID.Top);
  });

  it("defaults self loops to right-left pair for center handles", () => {
    const resolved = resolveConnectionHandles(
      {
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Center,
        targetHandle: ConnectionSourceID.Center,
      } as any,
      makeNode("1", 0, 0) as any,
      makeNode("1", 0, 0) as any,
    );

    expect(resolved.sourceHandle).toBe(ConnectionSourceID.Right);
    expect(resolved.targetHandle).toBe(ConnectionTargetID.Left);
  });

  it("keeps user-chosen sides for self loops", () => {
    const resolved = resolveConnectionHandles(
      {
        source: "1",
        target: "1",
        sourceHandle: ConnectionSourceID.Top,
        targetHandle: ConnectionTargetID.Bottom,
      } as any,
      makeNode("1", 0, 0) as any,
      makeNode("1", 0, 0) as any,
    );

    expect(resolved.sourceHandle).toBe(ConnectionSourceID.Top);
    expect(resolved.targetHandle).toBe(ConnectionTargetID.Bottom);
  });
});
