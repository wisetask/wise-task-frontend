import { CustomNode } from "@/features/graph/types/CustomNode";
import {
  ConnectionSourceID,
  ConnectionTargetID,
  CustomEdge,
} from "@/features/graph/types/CustomEdge";

export const changeDirectionsInCircularGraph = (
  nodes: CustomNode[],
  edges: CustomEdge[],
): CustomEdge[] => {
  // Функция изменяет направления соединений между узлами в круговом графе
  // Основные правила:
  // 1. Если source выше target:
  //    - source левее target: соединение справа (source) → слева (target)
  //    - source правее target: соединение слева (source) → справа (target)
  //    - одинаковые X: соединение снизу (source) → сверху (target)
  // 2. Если source ниже target:
  //    - source левее target: соединение справа (source) → слева (target)
  //    - source правее target: соединение слева (source) → справа (target)
  //    - одинаковые X: соединение сверху (source) → снизу (target)
  // 3. Если одинаковые Y координаты:
  //    - source левее target: соединение справа (source) → слева (target)
  //    - source правее target: соединение слева (source) → справа (target)

  const nodesMap: Map<string, CustomNode> = new Map<string, CustomNode>();
  const edgesMap: Map<string, Array<string>> = new Map<string, string[]>();

  nodes.forEach((node: CustomNode) => nodesMap.set(node.id, node));

  edges.forEach((edge: CustomEdge) => {
    if (!edgesMap.has(edge.source)) {
      edgesMap.set(edge.source, []);
    }
    edgesMap.get(edge.source)!.push(edge.target);
  });

  edgesMap.forEach((targetIds, sourceId) => {
    targetIds.forEach((targetId) => {
      const sourceNode: undefined | CustomNode = nodesMap.get(sourceId);
      const targetNode: undefined | CustomNode = nodesMap.get(targetId);

      if (!sourceNode || !targetNode) {
        console.warn("Узел не найден:", { sourceId, targetId });
        return;
      }

      const edge: undefined | CustomEdge = edges.find(
        (e) => e.source === sourceId && e.target === targetId,
      );

      if (!edge) {
        return;
      }

      if (sourceNode.position.y < targetNode.position.y) {
        if (sourceNode.position.x < targetNode.position.x) {
          edge.sourceHandle = ConnectionSourceID.Right;
          edge.targetHandle = ConnectionTargetID.Left;
        } else if (sourceNode.position.x > targetNode.position.x) {
          edge.sourceHandle = ConnectionSourceID.Left;
          edge.targetHandle = ConnectionTargetID.Right;
        } else {
          edge.sourceHandle = ConnectionSourceID.Bottom;
          edge.targetHandle = ConnectionTargetID.Top;
        }
      } else if (sourceNode.position.y > targetNode.position.y) {
        if (sourceNode.position.x < targetNode.position.x) {
          edge.sourceHandle = ConnectionSourceID.Right;
          edge.targetHandle = ConnectionTargetID.Left;
        } else if (sourceNode.position.x > targetNode.position.x) {
          edge.sourceHandle = ConnectionSourceID.Left;
          edge.targetHandle = ConnectionTargetID.Right;
        } else {
          edge.sourceHandle = ConnectionSourceID.Top;
          edge.targetHandle = ConnectionTargetID.Bottom;
        }
      } else {
        if (sourceNode.position.x < targetNode.position.x) {
          edge.sourceHandle = ConnectionSourceID.Right;
          edge.targetHandle = ConnectionTargetID.Left;
        } else if (sourceNode.position.x > targetNode.position.x) {
          edge.sourceHandle = ConnectionSourceID.Left;
          edge.targetHandle = ConnectionTargetID.Right;
        }
      }
    });
  });

  return edges;
};
