import { defineStore } from "pinia";
import { NodesStoreState } from "../types/NodesStore";
import { history } from "../lib/history/history";
import { CustomNode } from "@/features/graph/types/CustomNode";
import { CustomEdge } from "@/features/graph/types/CustomEdge";
import {
  ConnectedComponent,
  DrawerResults,
} from "@/features/graph/types/ConnectedComponents";
import { getConnectedComponents } from "@/features/graph/lib/helpers/getConnectedComponents";
import { isGraphBipartite } from "@/features/graph/lib/graphType/bipartite";
import { isGraphTree } from "@/features/graph/lib/graphType/tree";
import { isGraphChain } from "@/features/graph/lib/graphType/chain";
import { isGraphCycle } from "@/features/graph/lib/graphType/cycle";
import { drawTreeGraph } from "@/features/graph/lib/graphDrawers/tree";
import { drawChainGraph } from "@/features/graph/lib/graphDrawers/chain";
import { drawCycleGraph } from "@/features/graph/lib/graphDrawers/cycle";
import { drawBipartiteGraph } from "@/features/graph/lib/graphDrawers/bibartite";
import { drawDefaultTypeGraph } from "@/features/graph/lib/graphDrawers/default";
import { isGraphNearlyFull } from "@/features/graph/lib/graphType/nearlyFull";
import { drawNearlyFullGraph } from "@/features/graph/lib/graphDrawers/nearlyFull";
import {
  calculateHangingNodesAmount,
  calculateLeafsAmount,
  calculateSelfConnectedEdgesAmount,
} from "@/features/graph/lib/statistics/baseGraphStatistics";
import { graphSettingsStore } from "./graphSettings";

export const useNodeStore = defineStore("nodes", {
  state: (): NodesStoreState => ({
    nodes: [],
    edges: [],
    copiedNodes: [],
    copiedEdges: [],
    historyIndex: -1,
    isDirected: true,
    id: undefined,
    name: "",
    groups: [],
    statistic: undefined,
  }),

  actions: {
    toggleIsDirected(): void {
      this.isDirected = !this.isDirected;
    },

    addNode(params?: { x: number; y: number }): void {
      const id: string = Date.now().toString();
      const maxNum = this.getMaximumLabel();
      const label = maxNum === -1 ? "1" : maxNum.toString();
      const position = params
        ? { x: params.x, y: params.y }
        : { x: Math.random() * 400, y: Math.random() * 400 };
      this.nodes.push({
        id,
        position: position,
        type: "special",
        data: {
          label,
          weight: 0,
          size: {
            width: graphSettingsStore.defaultNodeSize,
            height: graphSettingsStore.defaultNodeSize,
          },
        },
      });
      history.onStateUpdate({ type: "node:add", properties: { nodeId: id } });
      this.regenerateStatistics();
    },

    undo() {
      this.$state = history.undo(this.$state);
      this.regenerateStatistics();
    },

    removeNode(id: string) {
      const removedNode: CustomNode | undefined = this.nodes.find(
        (node) => node.id === id,
      );
      if (!removedNode) {
        return;
      }
      this.nodes = this.nodes.filter((node) => node.id !== removedNode.id);
      const edges: CustomEdge[] = this.edges.filter(
        (edge: CustomEdge) =>
          edge.source === removedNode.id ||
          edge.target === removedNode.id,
      );
      history.onStateUpdate({
        type: "node:remove",
        properties: { node: removedNode, edges: edges },
      });
      this.regenerateStatistics();
    },

    normalizeView(): CustomEdge[] {
      history.onStateUpdate({
        type: "normalizing:full_backup",
        properties: {
          state: this.$state,
        },
      });
      const connectedComponents = getConnectedComponents(
        this.nodes,
        this.edges,
      );
      const componentResults: DrawerResults[] = connectedComponents.map(
        (component) => this.drawComponent(component),
      );

      const gridLayout: { width: number; height: number; isTree: boolean }[] =
        [];
      let maxRowHeight = 0;
      let currentRowWidth = 0;

      componentResults.forEach((result) => {
        const isTree = isGraphTree({
          nodes: result.nodes,
          edges: result.edges,
        });

        if (isTree || currentRowWidth + result.width > 1500) {
          if (currentRowWidth > 0) {
            gridLayout.push({
              width: currentRowWidth,
              height: maxRowHeight,
              isTree: false,
            });
          }
          gridLayout.push({
            width: result.width,
            height: result.height,
            isTree,
          });
          currentRowWidth = 0;
          maxRowHeight = 0;
        } else {
          currentRowWidth += result.width + 150;
          maxRowHeight = Math.max(maxRowHeight, result.height);
        }
      });

      if (currentRowWidth > 0) {
        gridLayout.push({
          width: currentRowWidth,
          height: maxRowHeight,
          isTree: false,
        });
      }

      let currentY = 0;
      let currentX = 0;
      let componentIndex = 0;

      gridLayout.forEach((row) => {
        if (row.isTree) {
          const result = componentResults[componentIndex++];
          result.nodes.forEach((node) => {
            node.position.x += currentX;
            node.position.y += currentY;
          });
          currentY += row.height + 100;
          currentX = 0;
        } else {
          let rowComponents = 0;
          while (
            componentIndex < componentResults.length &&
            !isGraphTree({
              nodes: componentResults[componentIndex].nodes,
              edges: componentResults[componentIndex].edges,
            }) &&
            rowComponents < 2
          ) {
            const result = componentResults[componentIndex++];
            result.nodes.forEach((node) => {
              node.position.x += currentX;
              node.position.y += currentY;
            });
            currentX += result.width + 150;
            rowComponents++;
          }
          currentY += row.height + 100;
          currentX = 0;
        }
      });

      this.nodes = componentResults.flatMap((r) => r.nodes);
      this.edges = componentResults.flatMap((r) => r.edges);

      return this.edges;
    },

    drawComponent(component: ConnectedComponent): DrawerResults {
      if (isGraphChain(component)) {
        return drawChainGraph(component.nodes, component.edges);
      }
      if (isGraphTree(component)) {
        return drawTreeGraph(component.nodes, component.edges);
      }
      if (isGraphCycle(component)) {
        return drawCycleGraph(component.nodes, component.edges);
      }
      if (isGraphBipartite(component)) {
        return drawBipartiteGraph(component.nodes, component.edges);
      }
      if (isGraphNearlyFull(component)) {
        return drawNearlyFullGraph(component.nodes, component.edges);
      }
      return drawDefaultTypeGraph(component.nodes, component.edges);
    },

    getNodeData(nodeId: string): undefined | CustomNode["data"] {
      const nodeIndex: number = this.nodes.findIndex(
        (node: CustomNode) => node.id === nodeId,
      );
      if (nodeIndex === -1) {
        return;
      }
      return this.nodes[nodeIndex].data;
    },

    updateNodeData(nodeId: string, data: CustomNode["data"]) {
      const nodeIndex: number = this.nodes.findIndex(
        (node: CustomNode) => node.id === nodeId,
      );
      if (nodeIndex === -1) {
        return;
      }
      const prevData = this.nodes[nodeIndex].data;
      this.nodes[nodeIndex].data = data;
      history.onStateUpdate({
        type: "node:change_data",
        properties: { nodeId: nodeId, data: prevData },
      });
    },

    nodeShift(nodeId: string, coords: { x: number; y: number }) {
      const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) {
        return;
      }
      history.onStateUpdate({
        type: "node:change_shift",
        properties: { nodeId: nodeId, position: coords },
      });
    },

    changeNodeSize(isIncreasing: boolean, nodeId: string) {
      const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) {
        return;
      }
      const size = this.nodes[nodeIndex].data.size?.width || 100;
      const newSize = isIncreasing ? size + 10 : size - 10;
      this.nodes[nodeIndex].data.size = { width: newSize, height: newSize };
      history.onStateUpdate({
        type: "node:change_size",
        properties: { nodeId: nodeId, prevSize: size },
      });
    },

    removeEdge(id: string): void {
      const edgeIndex = this.edges.findIndex((edge) => edge.id === id);
      if (edgeIndex === -1) {
        return;
      }
      history.onStateUpdate({
        type: "edge:remove",
        properties: this.edges[edgeIndex],
      });
      this.edges = this.edges.filter((edge) => edge.id !== id);
      this.regenerateStatistics();
    },

    updateEdge(
      id: string,
      updates: { color: string; weight: string | number },
    ): void {
      const edgeIndex: number = this.edges.findIndex((edge) => edge.id === id);
      if (edgeIndex === -1) return;

      history.onStateUpdate({
        type: "edge:change_data",
        properties: {
          edgeId: id,
          data: this.edges[edgeIndex].data,
        },
      });

      this.edges[edgeIndex].data = updates;
    },

    addEdge(edge: CustomEdge) {
      edge.data = {
        ...edge.data,
        color: "#949494",
        weight: 0,
      };
      this.edges.push(edge);
      history.onStateUpdate({
        type: "edge:add",
        properties: {
          edgeId: edge.id,
        },
      });
      this.regenerateStatistics();
    },

    selectNode(id: string) {
      const nodeIndex: number = this.nodes.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex].selected = true;
      }
    },

    unselectNode(id: string) {
      const nodeIndex = this.nodes.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex].selected = false;
      }
    },

    nodeMassMovement(
      nodePositions: Map<string, { x: number; y: number }>,
    ): void {
      history.onStateUpdate({
        type: "node:mass_movement",
        properties: nodePositions,
      });
    },

    nodesMassRemove(nodeIds: string[]): void {
      const nodes: CustomNode[] = this.nodes.filter((node) =>
        nodeIds.includes(node.id),
      );
      const edges: Set<CustomEdge> = new Set<CustomEdge>(
        this.edges.filter(
          (edge) =>
            nodeIds.includes(edge.source) ||
            nodeIds.includes(edge.target),
        ),
      );
      history.onStateUpdate({
        type: "node:mass_delete",
        properties: {
          nodes: nodes,
          edges: Array.from(edges),
        },
      });
      this.regenerateStatistics();
    },

    edgesMassRemove(edgeIds: string[]) {
      console.log(edgeIds);
      console.log(this.edges);
      const edges = this.edges.filter((edge) => edgeIds.includes(edge.id));
      if (edges.length === 0) {
        console.log("EDGES LENGTH IS 0");
        return;
      }
      console.log("EDGES для массового удаления", edges.length);
      history.onStateUpdate({
        type: "edge:mass_delete",
        properties: {
          edges,
        },
      });
    },

    getMaximumLabel(): number {
      let maxNumber = -1;
      for (const node of this.nodes) {
        const label = node.data.label;
        if (label && !isNaN(+label)) {
          maxNumber = Math.max(maxNumber, +label);
        }
      }
      return maxNumber === -1 ? 1 : maxNumber + 1;
    },

    setCopiedElements(nodes: CustomNode[], edges: CustomEdge[]) {
      this.copiedNodes = nodes;
      this.copiedEdges = edges;
      console.log("COPIED NODES LENGTH", this.copiedNodes.length);
      console.log("COPIED EDGES LENGTH", this.copiedEdges.length);
    },

    getCopiedElements(): { nodes: CustomNode[]; edges: CustomEdge[] } {
      const edges = this.copiedEdges;
      const nodes = this.copiedNodes;
      return { nodes, edges };
    },

    pasteElements(nodes: CustomNode[], edges: CustomEdge[]) {
      history.onStateUpdate({
        type: "all:paste",
        properties: {
          nodeIds: nodes.map((node) => node.id),
          edgeIds: edges.map((edge) => edge.id),
        },
      });
      this.nodes = [...this.nodes, ...nodes];
      this.edges = [...this.edges, ...edges];
    },

    regenerateStatistics(): void {
      this.statistic = {
        edgesAmount: this.edges.length,
        nodesAmount: this.nodes.length,
        selfLoopsAmount: calculateSelfConnectedEdgesAmount(this.edges),
        leafNodesAmount: calculateLeafsAmount(this.nodes, this.edges),
        hangingNodesAmount: calculateHangingNodesAmount(this.nodes, this.edges),
      };
    },
  },
});
