import { addLayout, addNode } from '@/components/graph/network/helper/graph';
import * as vNG from "v-network-graph"
import { Ref, computed, ref, watch } from "vue";
import { storeToRefs } from 'pinia';
import { ConstructionMode, useGraphStore } from '@/store/graph';


const { activeGraph, constructorGraphState } = storeToRefs(useGraphStore())

export function createEventHandlers(
	graph: Ref<vNG.Instance | undefined>,
	nodeMenu: Ref<HTMLDivElement | undefined>,
	menuTargetNode: Ref<string>,
	edgeMenu: Ref<HTMLDivElement | undefined>,
	menuTargetEdge: Ref<string>
) {
	const eventHandlers: vNG.EventHandlers = {
		"view:click": ({ event }) => {
			if (constructorGraphState.value.mode === ConstructionMode.DRAW) {
				if (!graph.value) return
				const nextNodeIndex = ref(Object.keys(activeGraph.value.nodes).length + 1)
				const nodeId = nextNodeIndex.value
				const point = { x: event.offsetX, y: event.offsetY }
				const svgPoint = graph.value.translateFromDomToSvgCoordinates(point)
				addNode({
						id: `node${nextNodeIndex.value}`,
						color: "BLUE",
						label: '',
						weight: ''
				}, activeGraph.value.nodes)
				addLayout({
						x: svgPoint.x,
						y: svgPoint.y,
						nodeId: nodeId
				}, activeGraph.value.layouts)
			}
		},
		"node:click": ({ node }) => {
			if (constructorGraphState.value.mode === ConstructionMode.DELETE) {
				if (!graph.value) return
				delete activeGraph.value.nodes[node]
			}
		},
		"edge:click": ({ edge }) => {
			if (edge === undefined) return
			if (constructorGraphState.value.mode === ConstructionMode.DELETE) {
				if (!graph.value) return
				delete activeGraph.value.edges[edge]
			}
		},
		"node:contextmenu": showNodeContextMenu,
		"edge:contextmenu": showEdgeContextMenu
	}

	function showContextMenu(element: HTMLElement, event: MouseEvent) {
		element.style.left = event.x + "px"
		element.style.top = event.y + "px"
		element.style.visibility = "visible"
		const handler = (event: PointerEvent) => {
			if (!event.target || (!(event.target as Element).classList.contains("v-list-item-title") && !element.contains(event.target as HTMLElement))) {
				element.style.visibility = "hidden"
				document.removeEventListener("pointerdown", handler, { capture: true })
			}
		}
		document.addEventListener("pointerdown", handler, { passive: true, capture: true })
	}

	function showNodeContextMenu(params: vNG.NodeEvent<MouseEvent>) {
		const { node, event } = params
		// Disable browser's default context menu
		event.stopPropagation()
		event.preventDefault()
		if (nodeMenu.value) {
			menuTargetNode.value = activeGraph.value.nodes[node].id ?? ""
			showContextMenu(nodeMenu.value, event)
		}
	}

	function showEdgeContextMenu(params: vNG.EdgeEvent<MouseEvent>) {
		const { edge, event } = params
		// Disable browser's default context menu
		event.stopPropagation()
		event.preventDefault()
		if (edgeMenu.value) {
			menuTargetEdge.value = activeGraph.value.edges[edge].id ?? ""
			showContextMenu(edgeMenu.value, event)
		}
	}

	return {
		eventHandlers
	}
}
