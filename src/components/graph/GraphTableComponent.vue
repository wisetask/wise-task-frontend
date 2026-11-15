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
import { DELETE_GRAPH } from '@/api/Mutations'
import { useMutation } from '@vue/apollo-composable'
import {
  applyEditorGraphState,
  vGraphToEditorState,
} from '@/features/graph/lib/helpers/graphToEditor'

export default defineComponent({
	emits: ['edited'],
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
			applyEditorGraphState(vGraphToEditorState(graph))
			this.$emit('edited')
		}
	}
})
</script>
