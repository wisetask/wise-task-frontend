import { ConnectedComponent } from "@/features/graph/types/ConnectedComponents";

export const isGraphStar = (component: ConnectedComponent): boolean => {
  if (component.edges.length !== component.nodes.length - 1) {
    return false;
  }

  const degreeCount = new Map<string, number>();

  for (const edge of component.edges) {
    const a = edge.source;
    const b = edge.target;

    degreeCount.set(a, (degreeCount.get(a) || 0) + 1);
    degreeCount.set(b, (degreeCount.get(b) || 0) + 1);
  }

  let centerNodeCount = 0;
  let leafCount = 0;

  for (const degree of degreeCount.values()) {
    if (degree === component.nodes.length - 1) {
      centerNodeCount++;
    } else if (degree === 1) {
      leafCount++;
    } else {
      return false;
    }
  }

  return centerNodeCount === 1 && leafCount === component.nodes.length - 1;
};
