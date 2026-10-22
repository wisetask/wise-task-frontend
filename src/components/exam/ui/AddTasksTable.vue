<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from "@vue/apollo-composable"
import { GET_ALL_TASKS } from "@/api/Queries"
import type { Task } from "@/__generated__/graphql"
import { useCreateExam } from "@/components/exam/stores/createExam"

const createExamParamsStore = useCreateExam()

const tasks = ref<Task[]>([])

const headers = [
  { title: 'Название', value: 'name' },
  { title: 'Описание', value: 'description' },
  { title: 'Категория', value: 'category' },
  { title: 'Тип задачи', value: 'taskType' },
]

const { onResult } = useQuery(GET_ALL_TASKS)
onResult((response) => {
  if (response.data) {
    tasks.value = response.data.getAllTasks.items ?? []
  }
})

const selectedTaskIds = computed(() => createExamParamsStore.selectedTasks.map(t => t.id))

function handleSelectionChange(newSelectedIds: string[]) {
  const newSelectedTasks = tasks.value.filter(task => newSelectedIds.includes(task.id))
  createExamParamsStore.setSelectedTasks(newSelectedTasks)
}
</script>

<template>
  <v-card class="task-table-card">
    <v-card-title class="blue white--text">Список задач</v-card-title>

    <v-data-table
        :headers="headers"
        :items="tasks"
        item-value="id"
        show-select
        :model-value="selectedTaskIds"
        @update:model-value="handleSelectionChange"
        class="elevation-2 task-table"
        :items-per-page="10"
    >
      <template #item.taskType="{ item }">
        {{ item.taskType }}
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
</style>
