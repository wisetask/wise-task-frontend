import { ConnectedComponent } from "@/features/graph/types/ConnectedComponents";

export const isGraphTree = (component: ConnectedComponent): boolean => {
  if (component.nodes.length === 0) return true;
  if (component.edges.length !== component.nodes.length - 1) return false;

  const adj = new Map<string, string[]>();
  component.nodes.forEach((node) => adj.set(node.id, []));
  component.edges.forEach((edge) => {
    adj.get(edge.source)!.push(edge.target);
    adj.get(edge.target)!.push(edge.source);
  });

  const visited = new Set<string>();
  const hasCycle = (node: string, parent: string | null): boolean => {
    visited.add(node);
    for (const neighbor of adj.get(node)!) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, node)) return true;
      } else if (neighbor !== parent) {
        return true;
      }
    }
    return false;
  };

  if (hasCycle(component.nodes[0].id, null)) return false;
  return visited.size === component.nodes.length;
};
