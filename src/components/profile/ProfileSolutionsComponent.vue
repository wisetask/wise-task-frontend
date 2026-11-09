<template>
  <div class="lv-page">
    <div class="lv-section-label lv-section-label--flush">Решения</div>

    <div v-if="loading || solutionsLoading" class="lv-loading">
      <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
      Загрузка...
    </div>

    <div v-else-if="solutions.length === 0" class="lv-empty">
      <v-icon icon="mdi-check-circle-outline" />
      Решений нет
    </div>

    <v-row v-else dense>
      <v-col v-for="solution in solutions" :key="solution.id" cols="12" sm="6" md="4">
        <div class="lv-card">
          <div class="lv-card__header">
            <span class="lv-card__icon">
              <v-icon size="20" :icon="solutionIcon(solution)" />
            </span>
            <div class="lv-card__title" :title="solutionTitle(solution)">
              {{ solutionTitle(solution) }}
            </div>
            <v-chip :color="solution.isCorrect ? 'success' : 'error'" size="x-small" variant="tonal">
              {{ solution.isCorrect ? "Верно" : "Неверно" }}
            </v-chip>
          </div>

          <div class="lv-card__chips">
            <v-chip size="x-small" variant="tonal" color="blue">
              {{ solutionTypeLabel(solution) }}
            </v-chip>
          </div>

          <div class="lv-card__row">
            <v-icon size="14" icon="mdi-compass-outline" />
            <span class="lv-card__row-text">{{ solutionDetails(solution) }}</span>
          </div>

          <div class="lv-card__footer">
            <v-btn size="small" rounded="lg" color="#1976d2" variant="flat" prepend-icon="mdi-eye"
                @click="showSolution(solution)">
              Открыть
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Solution, SolutionGraph, SolutionImplementation } from '@/__generated__/graphql'
import { GET_ALL_TASK_SOLUTIONS } from '@/api/Queries'
import { useSolutionStore } from '@/store/solution'
import { useQuery } from '@vue/apollo-composable'
import { storeToRefs } from 'pinia'
import { computed, defineComponent, ref, watchEffect } from 'vue'

import { Profile } from "@/__generated__/graphql";

type SolutionWithTask = Solution & { taskId?: string; __typename?: string }

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

    const isImplementation = (solution: SolutionWithTask) =>
        solution.__typename === 'SolutionImplementation'

    const solutionIcon = (solution: SolutionWithTask) =>
        isImplementation(solution) ? 'mdi-language-java' : 'mdi-graph-outline'

    const solutionTypeLabel = (solution: SolutionWithTask) =>
        isImplementation(solution) ? 'Программная' : 'Графовая'

    const solutionTitle = (solution: SolutionWithTask) =>
        solution.task?.name || solution.task?.id || solution.id

    const solutionDetails = (solution: SolutionWithTask) => {
      const s = solution as SolutionGraph
      if (s.__typename !== 'SolutionGraph' || !s.graph) {
        return 'Программное решение'
      }
      return `Вершин: ${s.graph.vertexCount ?? '—'} · Рёбер: ${s.graph.edgeCount ?? '—'}`
    }

    return {
      solutions,
      solutionsLoading,
      solutionIcon,
      solutionTypeLabel,
      solutionTitle,
      solutionDetails
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

<style>
@import "@/components/common/listViewStyles.css";
</style>
