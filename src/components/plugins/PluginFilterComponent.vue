<template>
  <v-card>
		<v-card-title class="pb-2">Фильтр модулей</v-card-title>
		<v-card-text class="pt-0">
			<v-text-field label="Название" v-model="nameModel" variant="outlined" density="compact" hide-details="auto" class="mb-2"></v-text-field>
			<v-text-field label="Описание" v-model="descriptionModel" variant="outlined" density="compact" hide-details="auto" class="mb-2"></v-text-field>
			<v-text-field label="Категория" v-model="categoryModel" variant="outlined" density="compact" hide-details="auto" class="mb-2"></v-text-field>
			<v-select
				label="Тип графа"
				:items="graphTypeItems"
				v-model="graphTypeModel"
				variant="outlined"
				density="compact"
				hide-details="auto"
			class="mb-2"
			></v-select>
			<v-select
				label="Тип плагина"
				:items="pluginTypeItems"
				v-model="pluginTypeModel"
				variant="outlined"
				density="compact"
				hide-details="auto"
			class="mb-2"
			></v-select>
			<v-select
				label="Автор"
				:items="authorItems"
				v-model="authorIdModel"
				variant="outlined"
				density="compact"
				hide-details="auto"
			class="mb-2"
			></v-select>
			<div class="d-flex">
				<v-checkbox label="Одобрен" v-model="isValidModel" density="compact" hide-details="auto" class="mr-4"></v-checkbox>
				<v-checkbox label="Внутренний" v-model="isInternalModel" density="compact" hide-details="auto"></v-checkbox>
			</div>
		</v-card-text>
		<v-card-actions class="d-flex justify-space-between">
			<v-btn @click="applyFilter" color="primary" variant="outlined">
				Найти
			</v-btn>
			<v-btn @click="resetFilter" color="primary" variant="outlined">
				Сбросить
			</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script lang="ts">
import { usePluginStore } from '@/store/plugin';
import { useProfileStore } from '@/store/profile';
import { storeToRefs } from 'pinia';
import { defineComponent, computed, onMounted } from 'vue'
import { GraphType, PluginType } from '@/__generated__/graphql';

export default defineComponent({
	setup() {
		const pluginStore = usePluginStore()
		const profileStore = useProfileStore()
		const { pluginFilter } = storeToRefs(pluginStore)

		onMounted(() => {
			profileStore.loadAuthors()
		})

		const authorItems = computed(() => {
			return [
				{ title: 'Все', value: '' },
				...profileStore.authors.map((author) => ({
					title: [author.lastName, author.firstName, author.email].filter(Boolean).join(' '),
					value: author.id
				}))
			]
		})

		const graphTypeItems = [
			{ title: 'Все', value: '' },
			...Object.values(GraphType).map((value) => ({ title: value, value })),
		]
		const pluginTypeItems = [
			{ title: 'Все', value: '' },
			...Object.values(PluginType).map((value) => ({ title: value, value })),
		]

		const nameModel = computed({
			get() {
				return pluginFilter.value.name
			},
			set(value) {
				pluginFilter.value.name = value ?? ''
			}
		})
		const descriptionModel = computed({
			get() {
				return pluginFilter.value.description
			},
			set(value) {
				pluginFilter.value.description = value ?? ''
			}
		})
		const categoryModel = computed({
			get() {
				return pluginFilter.value.category
			},
			set(value) {
				pluginFilter.value.category = value
			}
		})
		const graphTypeModel = computed({
			get() {
				return pluginFilter.value.graphType
			},
			set(value) {
				pluginFilter.value.graphType = value ?? ''
			}
		})
		const pluginTypeModel = computed({
			get() {
				return pluginFilter.value.pluginType
			},
			set(value) {
				pluginFilter.value.pluginType = value ?? ''
			}
		})
		const authorIdModel = computed({
			get() {
				return pluginFilter.value.authorId
			},
			set(value) {
				pluginFilter.value.authorId = value ?? ''
			}
		})
		const isValidModel = computed({
			get() {
				return pluginFilter.value.isValid
			},
			set(value) {
				pluginFilter.value.isValid = value
			}
		})
		const isInternalModel = computed({
			get() {
				return pluginFilter.value.isInternal
			},
			set(value) {
				pluginFilter.value.isInternal = value
			}
		})

		const applyFilter = () => {
			pluginFilter.value.isFiltered = true
			pluginFilter.value.appliedAt++
		}

		const resetFilter = () => {
			pluginFilter.value = {
				name: '',
				description: '',
				category: '',
				graphType: '',
				pluginType: '',
				isInternal: false,
				authorId: '',
				isValid: false,
				isFiltered: false,
				appliedAt: pluginFilter.value.appliedAt + 1
			}
		}

		return {
			nameModel,
			descriptionModel,
			categoryModel,
			graphTypeModel,
			graphTypeItems,
			pluginTypeModel,
			pluginTypeItems,
			authorIdModel,
			authorItems,
			isValidModel,
			isInternalModel,
			applyFilter,
			resetFilter
		}
	},
})
</script>
