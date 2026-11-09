<template>
  <div class="flt-panel">
    <div class="flt-panel__header">
      <span class="flt-panel__icon">
        <v-icon size="20" icon="mdi-filter-variant" />
      </span>
      <span class="flt-panel__title">Фильтр плагинов</span>
    </div>
    <div class="flt-panel__body">
      <v-text-field label="Название" v-model="nameModel" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
      <v-text-field label="Описание" v-model="descriptionModel" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
      <v-text-field label="Категория" v-model="categoryModel" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
      <v-select
        label="Тип графа"
        :items="graphTypeItems"
        v-model="graphTypeModel"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
      ></v-select>
      <v-select
        label="Тип плагина"
        :items="pluginTypeItems"
        v-model="pluginTypeModel"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
      ></v-select>
      <v-select
        label="Автор"
        :items="authorItems"
        v-model="authorIdModel"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
      ></v-select>
      <div class="flt-panel__checks">
        <v-checkbox label="Одобрен" v-model="isValidModel" density="compact" hide-details="auto"></v-checkbox>
        <v-checkbox label="Внутренний" v-model="isInternalModel" density="compact" hide-details="auto"></v-checkbox>
      </div>
    </div>
    <div class="flt-panel__actions">
      <v-btn color="#1976d2" variant="flat" prepend-icon="mdi-magnify" @click="applyFilter">
        Найти
      </v-btn>
      <v-btn color="#5c6470" variant="text" prepend-icon="mdi-filter-remove" @click="resetFilter">
        Сбросить
      </v-btn>
    </div>
  </div>
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

		const GRAPH_TYPE_LABELS: Record<string, string> = {
			[GraphType.Any]: 'Любой',
			[GraphType.Direct]: 'Направленный',
			[GraphType.Undirect]: 'Неориентированный',
		}
		const PLUGIN_TYPE_LABELS: Record<string, string> = {
			[PluginType.GraphCharacteristic]: 'Характеристика графа',
			[PluginType.GraphProperty]: 'Свойство графа',
			[PluginType.GraphNewGraph]: 'Новый граф',
			[PluginType.GraphString]: 'Строковый',
		}

		const graphTypeItems = [
			{ title: 'Все', value: '' },
			...Object.values(GraphType).map((value) => ({ title: GRAPH_TYPE_LABELS[value] ?? value, value })),
		]
		const pluginTypeItems = [
			{ title: 'Все', value: '' },
			...Object.values(PluginType).map((value) => ({ title: PLUGIN_TYPE_LABELS[value] ?? value, value })),
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

<style>
@import "@/components/common/filterStyles.css";
</style>
