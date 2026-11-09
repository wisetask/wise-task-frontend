<template>
  <div class="lv-page">
    <div v-if="graphLibrary.length === 0" class="lv-empty">
      <v-icon icon="mdi-graph-outline" />
      Графы не найдены
    </div>

    <v-row v-else dense>
      <v-col v-for="(graph, index) in graphLibrary" :key="graph.id ?? index" cols="12" sm="6">
        <div class="lv-card">
          <div class="lv-card__header">
            <span class="lv-card__icon">
              <v-icon size="20" icon="mdi-graph-outline" />
            </span>
            <div class="lv-card__title" :title="graph.name || ''">{{ graph.name || "Без названия" }}</div>
            <v-chip size="x-small" variant="tonal" :color="graph.isDirect ? 'indigo' : 'teal'">
              {{ graph.isDirect ? "Направленный" : "Неориентированный" }}
            </v-chip>
          </div>

          <div class="graph-table-card__preview">
            <graph-card-component :graph="graph" :key="graph.id" />
          </div>

          <div class="lv-card__row">
            <v-icon size="14" icon="mdi-account-outline" />
            <span class="lv-card__row-text">{{ formatAuthor(graph.author) }}</span>
          </div>

          <div class="lv-card__row">
            <v-icon size="14" icon="mdi-compass-outline" />
            <span class="lv-card__row-text">
              Вершин: {{ nodesCount(graph) }} · Рёбер: {{ edgesCount(graph) }}
            </span>
          </div>

          <div class="lv-card__footer">
            <v-btn size="small" rounded="lg" color="#1976d2" variant="flat" prepend-icon="mdi-pencil"
                @click="editItem(graph)">
              Изменить
            </v-btn>
            <v-spacer />
            <v-btn size="small" variant="text" color="#e53935" icon="mdi-delete" @click="deleteItem(graph)" />
          </div>
        </div>
      </v-col>
    </v-row>

    <div v-if="graphLibrary.length > 0" class="lv-footer">
      <span class="lv-footer__total">Всего: {{ graphLibrary.length }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useGraphStore, Graph } from '@/store/graph'
import { Profile } from '@/__generated__/graphql'
import { DELETE_GRAPH } from '@/api/Mutations'
import { useMutation } from '@vue/apollo-composable'
import {
  applyEditorGraphState,
  vGraphToEditorState,
} from '@/features/graph/lib/helpers/graphToEditor'

const formatAuthor = (author?: Profile | null) => {
	if (!author) return "Автор не указан"
	const fullName = [author.lastName, author.firstName, author.patronymic]
		.filter((part) => part && part.length > 0)
		.join(" ")
	return fullName || author.email
}

export default defineComponent({
	emits: ['edited'],
	setup() {
		const { graphLibrary, activeGraph } = storeToRefs(useGraphStore())
		return {
			graphLibrary,
			activeGraph,
			formatAuthor
		}
	},
	methods: {
		nodesCount(graph: Graph) {
			return Object.keys(graph.nodes ?? {}).length
		},
		edgesCount(graph: Graph) {
			return Object.keys(graph.edges ?? {}).length
		},
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

<style>
@import "@/components/common/listViewStyles.css";
</style>

<style scoped>
.graph-table-card__preview {
  border: 1px solid #dcebf8;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
}
</style>
