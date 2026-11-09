<template>
  <div class="flt-panel">
    <div class="flt-panel__header">
      <span class="flt-panel__icon">
        <v-icon size="20" icon="mdi-filter-variant" />
      </span>
      <span class="flt-panel__title">Фильтр графов</span>
    </div>
    <div class="flt-panel__body">
      <v-text-field
          label="Название"
          v-model="nameModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-text-field>
      <v-select
          label="Автор"
          :items="authorItems"
          v-model="authorIdModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-select>
      <v-text-field
          label="Количество вершин"
          type="number"
          v-model="vertexCountModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-text-field>
      <v-text-field
          label="Количество рёбер"
          type="number"
          v-model="edgeCountModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-text-field>
      <v-select
          label="Ориентированный"
          :items="isDirectItems"
          v-model="isDirectModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-select>
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
import { useGraphStore } from '@/store/graph'
import { useProfileStore } from '@/store/profile'
import { storeToRefs } from 'pinia'
import { defineComponent, computed, onMounted } from 'vue'

export default defineComponent({
  setup() {
    const { graphFilter } = storeToRefs(useGraphStore())
    const profileStore = useProfileStore()

    onMounted(() => {
      profileStore.loadAuthors()
    })

    const authorItems = computed(() => {
      return [
        { title: 'Все', value: '' },
        ...profileStore.authors.map((author) => ({
          title: [author.lastName, author.firstName, author.email].filter(Boolean).join(' '),
          value: author.id,
        })),
      ]
    })

    const isDirectItems = [
      { title: 'Все', value: '' },
      { title: 'Да', value: true },
      { title: 'Нет', value: false },
    ]

    const nameModel = computed({
      get() {
        return graphFilter.value.name
      },
      set(value: string) {
        graphFilter.value.name = value ?? ''
      },
    })

    const authorIdModel = computed({
      get() {
        return graphFilter.value.authorId
      },
      set(value: string) {
        graphFilter.value.authorId = value ?? ''
      },
    })

    const vertexCountModel = computed({
      get() {
        return graphFilter.value.vertexCount
      },
      set(value: string | number | null) {
        const parsed = value === null || value === '' ? null : Number(value)
        graphFilter.value.vertexCount = parsed !== null && !isNaN(parsed) ? parsed : null
      },
    })

    const edgeCountModel = computed({
      get() {
        return graphFilter.value.edgeCount
      },
      set(value: string | number | null) {
        const parsed = value === null || value === '' ? null : Number(value)
        graphFilter.value.edgeCount = parsed !== null && !isNaN(parsed) ? parsed : null
      },
    })

    const isDirectModel = computed({
      get() {
        return graphFilter.value.isDirect
      },
      set(value: string | boolean) {
        graphFilter.value.isDirect = value ?? ''
      },
    })

    const applyFilter = () => {
      graphFilter.value.isFiltered = true
      graphFilter.value.appliedAt++
    }

    const resetFilter = () => {
      graphFilter.value = {
        name: '',
        authorId: '',
        vertexCount: null,
        edgeCount: null,
        isDirect: '',
        isNamed: '',
        isFiltered: false,
        appliedAt: graphFilter.value.appliedAt + 1,
      }
    }

    return {
      authorItems,
      isDirectItems,
      nameModel,
      authorIdModel,
      vertexCountModel,
      edgeCountModel,
      isDirectModel,
      applyFilter,
      resetFilter,
    }
  },
})
</script>

<style>
@import "@/components/common/filterStyles.css";
</style>
