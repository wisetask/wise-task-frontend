<template>
	<div class="graph-card">
		<v-network-graph
			:style="graphStyle"
			:nodes="graph.nodes"
			:edges="graph.edges"
			:layouts="graph.layouts"
			:configs="configs"
		>
		<template
			#override-node-label="{
				nodeId, scale, x, y, config, textAnchor, dominantBaseline
			}"
			>
			<text
				x="0"
				y="0"
				:font-size="9 * scale"
				text-anchor="middle"
				dominant-baseline="central"
				fill="#ffffff"
			>{{ graph.nodes[nodeId].weight }}</text>
			<text
				x="0"
				y="0"
				:font-size="config.fontSize * scale"
				:text-anchor="textAnchor"
				:dominant-baseline="dominantBaseline"
				:fill="config.color"
				:transform="`translate(${x} ${y})`"
			>{{ graph.nodes[nodeId].label }}</text>
		</template>
		<template #edge-label="{ edgeId, ...slotProps }">
		<v-edge-label
			:text="`${graph.edges[edgeId].weight}`"
			align="center"
			vertical-align="below"
			v-bind="slotProps"
		/>
		<v-edge-label
			:text="`${graph.edges[edgeId].label}`"
			align="center"
			vertical-align="above"
			v-bind="slotProps"
		/>
		</template>
		</v-network-graph>
	</div>

</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, toRefs } from 'vue'
import undirectGraphConfigs, { directGraphConfigs } from "@/components/graph/network/helper/graphConfig"
import * as vNG from "v-network-graph"

interface GraphCardGraph {
	nodes: vNG.Nodes
	edges: vNG.Edges
	layouts: vNG.Layouts
	isDirect?: boolean
}

export default defineComponent({
	props: {
		graph: {
			type: Object as PropType<GraphCardGraph>,
			required: true
		}
	},
	setup(props) {
		const { graph } = toRefs(props)
		const graphStyle = computed(() => {
			return {
				"width": "100%",
				"height": "160px",
				"display": "block"
			}
		})
		const configs = computed(() => {
			if (graph.value && graph.value.isDirect) {
				return directGraphConfigs
			}
			return undirectGraphConfigs
		})
		return {
			graph,
			configs,
			graphStyle
		}
	}
})
</script>

<style scoped>
.graph-card {
	background: #ffffff;
}
</style>
