import { CustomNode } from "@/features/graph/types/CustomNode";
import { CustomEdge } from "@/features/graph/types/CustomEdge";

interface LinkedListNode {
  node: CustomNode;
  next: LinkedListNode | null;
}

/**
 * Возвращает массив узлов в порядке следования по графу-цепи, поддерживает циклы.
 */
const getNodesPriority = (
  nodes: CustomNode[],
  edges: CustomEdge[],
): CustomNode[] => {
  if (nodes.length === 0) return [];

  const nodeById = new Map<string, CustomNode>();
  for (const node of nodes) {
    nodeById.set(node.id, node);
  }

  const outgoing = new Map<string, CustomEdge>();
  const incoming = new Map<string, CustomEdge>();

  for (const edge of edges) {
    outgoing.set(edge.source, edge);
    incoming.set(edge.target, edge);
  }

  let startNode: CustomNode | undefined = undefined;
  for (const node of nodes) {
    if (!incoming.has(node.id)) {
      startNode = node;
      break;
    }
  }

  if (!startNode) {
    startNode = nodes[0];
  }

  const visited = new Set<string>();
  const priorityList: CustomNode[] = [];

  let currentNode = startNode;
  while (currentNode && !visited.has(currentNode.id)) {
    priorityList.push(currentNode);
    visited.add(currentNode.id);

    const edge = outgoing.get(currentNode.id);
    if (!edge) break;
    // @ts-ignore
    currentNode = edge.targetNode;
  }

  return priorityList.reverse();
};

/**
 * Возвращает связанный список графа (реальный LinkedList)
 */
export const buildLinkedListFromGraph = (
  nodes: CustomNode[],
  edges: CustomEdge[],
): LinkedListNode | null => {
  const ordered = getNodesPriority(nodes, edges);
  console.log("Priorities", ordered);
  if (ordered.length === 0) return null;

  let head: LinkedListNode = {
    node: ordered[0],
    next: null,
  };

  let current = head;
  for (let i = 1; i < ordered.length; i++) {
    const newNode: LinkedListNode = {
      node: ordered[i],
      next: null,
    };
    current.next = newNode;
    current = newNode;
  }

  console.log(head);

  return head;
};
