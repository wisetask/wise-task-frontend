<template>
  <v-card>
		<v-data-table
			:headers="headers"
			:items="graphLibrary"
		>
			<template v-slot:item.actions="{ item }">
				<v-icon
					class="me-2"
					size="small"
					@click="editItem(item)"
				>
					mdi-pencil
				</v-icon>
				<v-icon
					size="small"
					@click="deleteItem(item)"
				>
					mdi-delete
				</v-icon>
			</template>
			<template v-slot:item.graph="{ item }">
				<graph-card-component
					v-bind:graph = "item"
					v-bind:key = "item.name">

				</graph-card-component>
			</template>
		</v-data-table>
	</v-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useGraphStore, Graph } from '@/store/graph'
import { addNode, addLayout, addEdge } from './network/helper/graph'
import { DELETE_GRAPH } from '@/api/Mutations'
import { useMutation } from '@vue/apollo-composable'

export default defineComponent({
	setup() {
		const { graphLibrary, activeGraph } = storeToRefs(useGraphStore())
		const headers = [
			{ key: 'name', title: 'Название' },
			{ key: 'actions', title: 'Действия', sortable: false },
			{ key: 'graph', title: 'Граф', sortable: false }
		]
		return {
			graphLibrary,
			headers,
			activeGraph
		}
	},
	methods: {
		deleteItem(graph: Graph) {
			const { mutate, onDone, onError } = useMutation(DELETE_GRAPH)
			const request = {
				id: graph.id
			}
			mutate(request)
			onDone(response => {
				this.graphLibrary = this.graphLibrary.filter(item => {
					return item.id !== graph.id
				})
			})

			onError(({graphQLErrors}) => {
				if (graphQLErrors) {
				graphQLErrors.map(({message}) => {
					console.error(message)
				})
				} 
			})
		},
		editItem(graph: Graph) {
			this.activeGraph = {
				name: null,
				isDirect: false,
                edges: {},
                nodes: {},
                layouts: { nodes: {} }
			}
			Object.entries(graph.nodes).forEach(([key, node]) => {
				addNode({
					id: node?.id,
					color: node?.color,
					label: node?.label,
					weight: node?.weight,
				}, this.activeGraph.nodes)
			})
			console.log(graph.nodes)
			Object.entries(graph.layouts).forEach(([key, layout]) => {
				Object.entries(layout).forEach(([k, nodeLayout]) => {
					addLayout({
						x: nodeLayout?.x,
						y: nodeLayout?.y,
						nodeId: nodeLayout.nodeId
					}, this.activeGraph.layouts)
				})
			})
			Object.entries(graph.edges).forEach(([key, edge]) => {
				addEdge({
					id: edge?.id,
					color: edge?.color,
					label: edge?.label,
					weight: edge?.weight,
					source: edge?.source,
					target: edge?.target 
				}, this.activeGraph.edges)
			})
			this.activeGraph.name = graph.name
		}
	}
})
</script>
