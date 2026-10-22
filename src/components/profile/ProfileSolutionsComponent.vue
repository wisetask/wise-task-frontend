<template>
  <v-skeleton-loader
      v-if="loading"
      class="mx-auto border"
      type="table"
  />
  <v-card v-else>
    <v-card-title>Решения</v-card-title>
    <v-data-table
        :headers="headers"
        :items="solutions"
        :loading="solutionsLoading"
    >
      <template v-slot:item.isCorrect="{ item }">
        <v-chip :color="item.isCorrect ? 'success' : 'error'" size="small">
          {{ item.isCorrect ? 'Верно' : 'Неверно' }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon
            class="me-2"
            size="small"
            @click="showSolution(item)"
        >
          mdi-eye
        </v-icon>
      </template>
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Solution, SolutionGraph, SolutionImplementation } from '@/__generated__/graphql'
import { GET_ALL_TASK_SOLUTIONS } from '@/api/Queries'
import { useSolutionStore } from '@/store/solution'
import { useQuery } from '@vue/apollo-composable'
import { storeToRefs } from 'pinia'
import { computed, defineComponent, ref, watchEffect } from 'vue'

import { Profile } from "@/__generated__/graphql";

type SolutionWithTask = Solution & { taskId?: string }

export default defineComponent({
  name: 'UserSolutions',
  props: {
    profile: {
      type: Object as () => Profile,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const solutionStore = useSolutionStore()
    const { activeUserSolutions } = storeToRefs(solutionStore)
    const solutions = ref<SolutionWithTask[]>([])

    const userId = computed(() => {
      return props.profile?.id || ''
    })


    const { onResult, loading: solutionsLoading } = useQuery(
        GET_ALL_TASK_SOLUTIONS,
        () => ({
          request: {
            authorId: userId.value,
            pagination: { page: 0, pageSize: 100 },
          },
        }),
        () => ({
          skip: !userId.value,
          fetchPolicy: 'cache-and-network'
        })
    )

    onResult(response => {
      if (response.data?.getAllTaskSolutions?.items) {
        solutions.value = response.data.getAllTaskSolutions.items
      }
    })

    watchEffect(() => {
      if (activeUserSolutions.value) {
        solutions.value = activeUserSolutions.value
      }
    })

    const headers = [
      { key: 'id', title: 'Идентификатор задачи' },
      { key: 'isCorrect', title: 'Результат решения', sortable: true },
      { key: 'actions', title: 'Действия', sortable: false }
    ]

    return {
      solutions,
      headers,
      solutionsLoading
    }
  },
  methods: {
    showSolution(solution: SolutionWithTask) {
      const s = solution as SolutionGraph | SolutionImplementation

      switch (s.__typename) {
        case 'SolutionGraph':
          this.$router.push(`/tasks/graph/${s.task?.id}/solution/${s.id}`)
          break
        case 'SolutionImplementation':
          this.$router.push(`/solution/implementation/${s.id}`)
          break
        default:
          console.warn('Unknown solution type:', s.__typename)
      }
    }
  }
})
</script>