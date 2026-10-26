<template>
  <v-card>
    <v-card-title>Фильтр задач</v-card-title>
    <v-card-text>
      <v-text-field
          label="Название"
          v-model="nameModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-text-field>
      <v-text-field
          label="Описание"
          v-model="descriptionModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-text-field>
      <v-text-field
          label="Категория"
          v-model="categoryModel"
          variant="outlined"
          density="compact"
          hide-details="auto"
          class="mb-2"
      ></v-text-field>
      <v-select
          label="Тип задачи"
          :items="taskTypeItems"
          v-model="taskTypeModel"
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
import { useTaskStore } from '@/store/task'
import { useProfileStore } from '@/store/profile'
import { storeToRefs } from 'pinia'
import { defineComponent, computed, onMounted } from 'vue'

export default defineComponent({
  setup() {
    const { taskFilter } = storeToRefs(useTaskStore())
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

    const taskTypeItems = [
      { title: 'Все', value: '' },
      { title: 'GRAPH', value: 'GRAPH' },
      { title: 'IMPLEMENTATION', value: 'IMPLEMENTATION' },
    ]

    const nameModel = computed({
      get() {
        return taskFilter.value.name
      },
      set(value: string) {
        taskFilter.value.name = value ?? ''
      },
    })

    const descriptionModel = computed({
      get() {
        return taskFilter.value.description
      },
      set(value: string) {
        taskFilter.value.description = value ?? ''
      },
    })

    const categoryModel = computed({
      get() {
        return taskFilter.value.category
      },
      set(value: string) {
        taskFilter.value.category = value ?? ''
      },
    })

    const taskTypeModel = computed({
      get() {
        return taskFilter.value.taskType
      },
      set(value: string) {
        taskFilter.value.taskType = value ?? ''
      },
    })

    const authorIdModel = computed({
      get() {
        return taskFilter.value.authorId
      },
      set(value: string) {
        taskFilter.value.authorId = value ?? ''
      },
    })

    return {
      nameModel,
      descriptionModel,
      categoryModel,
      taskTypeModel,
      taskTypeItems,
      authorIdModel,
      authorItems,
      applyFilter: () => {
        taskFilter.value.isFiltered = true
        taskFilter.value.appliedAt++
      },
      resetFilter: () => {
        taskFilter.value = {
          name: '',
          description: '',
          category: '',
          taskType: '',
          authorId: '',
          isPublic: false,
          isFiltered: false,
          appliedAt: taskFilter.value.appliedAt + 1,
        }
      },
    }
  },
})
</script>
