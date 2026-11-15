import { ConnectedComponent } from "@/features/graph/types/ConnectedComponents";

export const isGraphNearlyFull = (
  connectedComponent: ConnectedComponent,
): boolean => {
  const nodesAmount: number = connectedComponent.nodes.length;

  const uniqueNodePairs: Set<string> = new Set();
  for (const edge of connectedComponent.edges) {
    const [id1, id2] = [edge.source, edge.target].sort();
    uniqueNodePairs.add(`${id1}-${id2}`);
  }

  const maxEdges: number = (nodesAmount * (nodesAmount - 1)) / 2;
  const fillRatio: number = uniqueNodePairs.size / maxEdges;

  return fillRatio >= 0.7;
};
