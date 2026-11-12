import type { Connection, GraphNode } from "@vue-flow/core";
import { Position } from "@vue-flow/core";
import {
  ConnectionSourceID,
  ConnectionTargetID,
} from "@/features/graph/types/CustomEdge";
import { graphSettingsStore } from "@/features/graph/stores/graphSettings";
import { DEFAULT_NODE_SIZE } from "@/features/graph/config/nodeDefaultSettings";

type HandlesNode = {
  id: string;
  position?: { x: number; y: number };
  computedPosition?: { x: number; y: number };
  dimensions?: { width: number; height: number };
  data?: { size?: { width: number; height: number } };
};

const CENTER_HANDLE_IDS = new Set<string>([
  ConnectionSourceID.Center,
  ConnectionTargetID.Center,
]);

const SOURCE_ID_TO_POSITION: Partial<Record<ConnectionSourceID, Position>> = {
  [ConnectionSourceID.Right]: Position.Right,
  [ConnectionSourceID.Left]: Position.Left,
  [ConnectionSourceID.Top]: Position.Top,
  [ConnectionSourceID.Bottom]: Position.Bottom,
};

const TARGET_ID_TO_POSITION: Partial<Record<ConnectionTargetID, Position>> = {
  [ConnectionTargetID.Right]: Position.Right,
  [ConnectionTargetID.Left]: Position.Left,
  [ConnectionTargetID.Top]: Position.Top,
  [ConnectionTargetID.Bottom]: Position.Bottom,
};

const POSITION_TO_SOURCE_ID: Record<Position, ConnectionSourceID> = {
  [Position.Right]: ConnectionSourceID.Right,
  [Position.Left]: ConnectionSourceID.Left,
  [Position.Top]: ConnectionSourceID.Top,
  [Position.Bottom]: ConnectionSourceID.Bottom,
};

const POSITION_TO_TARGET_ID: Record<Position, ConnectionTargetID> = {
  [Position.Right]: ConnectionTargetID.Right,
  [Position.Left]: ConnectionTargetID.Left,
  [Position.Top]: ConnectionTargetID.Top,
  [Position.Bottom]: ConnectionTargetID.Bottom,
};

const OPPOSITE_POSITIONS: Record<Position, Position> = {
  [Position.Right]: Position.Left,
  [Position.Left]: Position.Right,
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
};

const isCenterOrMissingHandle = (handleId?: string | null): boolean =>
  !handleId || CENTER_HANDLE_IDS.has(handleId);

const getHandlePosition = (handleId?: string | null): Position | undefined =>
  SOURCE_ID_TO_POSITION[handleId as ConnectionSourceID] ??
  TARGET_ID_TO_POSITION[handleId as ConnectionTargetID];

export const normalizeConnectionHandles = (
  connection: Connection,
): Connection => {
  const sourcePosition = getHandlePosition(connection.sourceHandle);
  const targetPosition = getHandlePosition(connection.targetHandle);

  return {
    ...connection,
    sourceHandle: sourcePosition
      ? POSITION_TO_SOURCE_ID[sourcePosition]
      : connection.sourceHandle,
    targetHandle: targetPosition
      ? POSITION_TO_TARGET_ID[targetPosition]
      : connection.targetHandle,
  };
};

export const isValidSelfLoopConnection = (connection: Connection): boolean => {
  const sourcePosition = getHandlePosition(connection.sourceHandle);
  const targetPosition = getHandlePosition(connection.targetHandle);

  return (
    !!sourcePosition &&
    !!targetPosition &&
    OPPOSITE_POSITIONS[sourcePosition] === targetPosition
  );
};

const getNodeSize = (node: HandlesNode) => ({
  width: node.dimensions?.width ?? node.data?.size?.width ?? DEFAULT_NODE_SIZE.width,
  height:
    node.dimensions?.height ?? node.data?.size?.height ?? DEFAULT_NODE_SIZE.height,
});

const getNodeCenter = (node: HandlesNode) => {
  const position = node.computedPosition ?? node.position ?? { x: 0, y: 0 };
  const { width, height } = getNodeSize(node);
  return { x: position.x + width / 2, y: position.y + height / 2 };
};

export const computePreferredHandles = (
  sourceNode: HandlesNode,
  targetNode: HandlesNode,
): {
  sourceHandle: ConnectionSourceID;
  targetHandle: ConnectionTargetID;
  sourcePosition: Position;
  targetPosition: Position;
} => {
  if (sourceNode.id === targetNode.id) {
    return {
      sourceHandle: ConnectionSourceID.Right,
      targetHandle: ConnectionTargetID.Left,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  }

  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? {
          sourceHandle: ConnectionSourceID.Right,
          targetHandle: ConnectionTargetID.Left,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        }
      : {
          sourceHandle: ConnectionSourceID.Left,
          targetHandle: ConnectionTargetID.Right,
          sourcePosition: Position.Left,
          targetPosition: Position.Right,
        };
  }

  return deltaY >= 0
    ? {
        sourceHandle: ConnectionSourceID.Bottom,
        targetHandle: ConnectionTargetID.Top,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      }
    : {
        sourceHandle: ConnectionSourceID.Top,
        targetHandle: ConnectionTargetID.Bottom,
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      };
};

export const resolveConnectionHandles = (
  connection: Connection,
  sourceNode?: GraphNode,
  targetNode?: GraphNode | null,
): Connection => {
  if (!sourceNode || !targetNode) {
    return connection;
  }

  const normalized = normalizeConnectionHandles(connection);

  if (sourceNode.id === targetNode.id) {
    if (
      isCenterOrMissingHandle(normalized.sourceHandle) &&
      isCenterOrMissingHandle(normalized.targetHandle)
    ) {
      return {
        ...normalized,
        sourceHandle: ConnectionSourceID.Right,
        targetHandle: ConnectionTargetID.Left,
      };
    }
    return normalized;
  }

  const preferredHandles = computePreferredHandles(sourceNode, targetNode);
  const shouldUsePreferredHandles = graphSettingsStore.isOneHandle;

  return {
    ...normalized,
    sourceHandle:
      shouldUsePreferredHandles ||
      isCenterOrMissingHandle(normalized.sourceHandle)
      ? preferredHandles.sourceHandle
      : normalized.sourceHandle,
    targetHandle:
      shouldUsePreferredHandles ||
      isCenterOrMissingHandle(normalized.targetHandle)
      ? preferredHandles.targetHandle
      : normalized.targetHandle,
  };
};
