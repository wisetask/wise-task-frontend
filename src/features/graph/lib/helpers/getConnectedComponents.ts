import { CustomNode } from "@/features/graph/types/CustomNode";
import { CustomEdge } from "@/features/graph/types/CustomEdge";
import { ConnectedComponent } from "@/features/graph/types/ConnectedComponents";

export const getConnectedComponents = (
  nodes: CustomNode[],
  edges: CustomEdge[],
): ConnectedComponent[] => {
  const adjacency: Record<string, Set<string>> = {};
  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    adjacency[node.id] = new Set();
  });

  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency[edge.source].add(edge.target);
      adjacency[edge.target].add(edge.source);
    }
  });

  const visited = new Set<string>();
  const components: ConnectedComponent[] = [];

  const dfs = (nodeId: string, componentNodeIds: Set<string>) => {
    const stack = [nodeId];
    visited.add(nodeId);

    while (stack.length > 0) {
      const current = stack.pop()!;
      componentNodeIds.add(current);

      for (const neighbor of adjacency[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const componentNodeIds = new Set<string>();
      dfs(node.id, componentNodeIds);

      components.push({
        nodes: nodes.filter((n) => componentNodeIds.has(n.id)),
        edges: edges.filter(
          (e) =>
            componentNodeIds.has(e.source) && componentNodeIds.has(e.target),
        ),
      });
    }
  }
  return components;
};
