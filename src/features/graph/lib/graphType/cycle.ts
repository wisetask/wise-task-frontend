import { ConnectedComponent } from "@/features/graph/types/ConnectedComponents";

export const isGraphCycle = (
  connectedComponent: ConnectedComponent,
): boolean => {
  const { nodes, edges } = connectedComponent;

  if (edges.length === 0 || nodes.length !== edges.length) {
    return false;
  }

  const degreeMap: Map<string, number> = new Map<string, number>();

  for (const edge of edges) {
    const sourceId = edge.source;
    const targetId = edge.target;

    degreeMap.set(sourceId, (degreeMap.get(sourceId) ?? 0) + 1);
    degreeMap.set(targetId, (degreeMap.get(targetId) ?? 0) + 1);
  }

  for (const node of nodes) {
    const degree: number = degreeMap.get(node.id) ?? 0;

    if (degree !== 2) {
      return false;
    }
  }

  return true;
};
