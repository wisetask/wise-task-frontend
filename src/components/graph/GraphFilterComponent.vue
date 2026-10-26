<template>
  <v-card>
    <v-card-title>Фильтр графов</v-card-title>
    <v-card-text>
      <v-text-field
          label="Название"
          v-model="nameModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-text-field>
      <v-select
          label="Автор"
          :items="authorItems"
          v-model="authorIdModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-select>
      <v-text-field
          label="Количество вершин"
          type="number"
          v-model="vertexCountModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-text-field>
      <v-text-field
          label="Количество рёбер"
          type="number"
          v-model="edgeCountModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-text-field>
      <v-select
          label="Ориентированный"
          :items="isDirectItems"
          v-model="isDirectModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-select>
      <v-select
          label="Именованный"
          :items="isNamedItems"
          v-model="isNamedModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-select>
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
    const isNamedItems = [
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

    const isNamedModel = computed({
      get() {
        return graphFilter.value.isNamed
      },
      set(value: string | boolean) {
        graphFilter.value.isNamed = value ?? ''
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
      isNamedItems,
      nameModel,
      authorIdModel,
      vertexCountModel,
      edgeCountModel,
      isDirectModel,
      isNamedModel,
      applyFilter,
      resetFilter,
    }
  },
})
</script>
