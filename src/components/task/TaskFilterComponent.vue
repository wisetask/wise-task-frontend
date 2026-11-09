<template>
  <div class="flt-panel">
    <div class="flt-panel__header">
      <span class="flt-panel__icon">
        <v-icon size="20" icon="mdi-filter-variant" />
      </span>
      <span class="flt-panel__title">Фильтр задач</span>
    </div>
    <div class="flt-panel__body">
      <v-text-field
          label="Название"
          v-model="nameModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-text-field>
      <v-text-field
          label="Описание"
          v-model="descriptionModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-text-field>
      <v-text-field
          label="Категория"
          v-model="categoryModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
      ></v-text-field>
      <v-select
          label="Тип задачи"
          :items="taskTypeItems"
          v-model="taskTypeModel"
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
import { useTaskStore } from '@/store/task'
import { useProfileStore } from '@/store/profile'
import { storeToRefs } from 'pinia'
import { defineComponent, computed, onMounted } from 'vue'
import { TaskType } from '@/__generated__/graphql'

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
      { title: 'Графовая', value: TaskType.Graph },
      { title: 'Программная', value: TaskType.Implementation },
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

<style>
@import "@/components/common/filterStyles.css";
</style>
