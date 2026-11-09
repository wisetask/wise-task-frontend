<template>
  <div class="lv-page">
    <div class="lv-toolbar">
      <v-text-field
          v-model="vectorQuery"
          label="Векторный поиск"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          single-line
          clearable
      />
    </div>

    <div v-if="loading || vectorLoading" class="lv-loading">
      <v-progress-circular indeterminate size="20" width="2" />
      Загрузка...
    </div>

    <div v-else-if="displayItems.length === 0" class="lv-empty">
      <v-icon icon="mdi-magnify" />
      Ничего не найдено
    </div>

    <template v-else>
      <template v-for="group in groupedItems" :key="group.category">
        <div class="lv-section-label">{{ group.category }}</div>
        <v-row dense>
          <v-col v-for="task in group.items" :key="task.id" cols="12" sm="6" md="4" xl="3">
            <div class="lv-card">
              <div class="lv-card__header">
                <span class="lv-card__icon">
                  <v-icon size="20" :icon="taskTypeIcon(task.taskType)" />
                </span>
                <div class="lv-card__title" :title="task.name">{{ task.name }}</div>
              </div>

              <p v-if="task.description" class="lv-card__text">{{ task.description }}</p>

              <div class="lv-card__chips">
                <v-chip size="x-small" variant="tonal" color="blue">
                  {{ taskTypeLabel(task.taskType) }}
                </v-chip>
              </div>

              <div class="lv-card__row">
                <v-icon size="14" icon="mdi-account-outline" />
                <span class="lv-card__row-text">{{ formatAuthor(task.author) }}</span>
              </div>

              <div class="lv-card__footer">
                <v-btn size="small" rounded="lg" color="#1976d2" variant="flat" prepend-icon="mdi-school"
                    @click="solveTask(task)">
                  Решить
                </v-btn>
                <v-spacer />
                <v-btn v-if="isUserAdmin" size="small" variant="text" color="#e53935" icon="mdi-delete"
                    @click="deleteTask(task)" />
              </div>
            </div>
          </v-col>
        </v-row>
      </template>
    </template>

    <div v-if="!vectorResults && !(loading || vectorLoading)" class="lv-footer">
      <span class="lv-footer__total">Всего: {{ displayTotal }}</span>
      <v-pagination
          v-model="page"
          :length="pageCount"
          :total-visible="7"
          density="comfortable"
          rounded="circle"
          class="lv-pagination"
      />
      <v-select
          v-model="pageSize"
          :items="[5, 10, 25, 50, 100]"
          label="На странице"
          density="comfortable"
          variant="outlined"
          hide-details
          class="lv-page-size"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useTaskStore } from "@/store/task";
import { Profile, Task, TaskType } from "@/__generated__/graphql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_ALL_TASKS } from "@/api/Queries";
import { DELETE_TASK } from "@/api/Mutations";
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser";
import { useProfileStore } from "@/store/profile";
import { searchTasks } from "@/services/semanticSearchApi";

const TASK_TYPE_META: Record<string, { label: string; icon: string }> = {
  [TaskType.Graph]: { label: "Графовая", icon: "mdi-graph-outline" },
  [TaskType.Implementation]: { label: "Программная", icon: "mdi-language-java" },
};

export default defineComponent({
  name: "TaskList",
  setup() {
    const taskStore = useTaskStore();
    const profileStore = useProfileStore();
    const { tasks } = storeToRefs(taskStore);

    onMounted(() => {
      ensureActiveUser();
    });

    const totalCount = ref(0);
    const page = ref(1);
    const pageSize = ref(10);

    const requestVariables = computed(() => {
      const filter = taskStore.taskFilter;
      // Поля фильтра уходят на бэкенд только после нажатия «Найти» (isFiltered).
      // Векторный поиск сюда не попадает: он ходит только в сервис на localhost.
      const requestFilter: Record<string, unknown> = {};
      if (filter.isFiltered) {
        requestFilter.name = filter.name || undefined;
        requestFilter.description = filter.description || undefined;
        requestFilter.category = filter.category || undefined;
        requestFilter.taskType = filter.taskType || undefined;
        requestFilter.authorId = filter.authorId || undefined;
      }
      return {
        request: {
          pagination: {
            page: page.value - 1,
            pageSize: pageSize.value,
          },
          filter: requestFilter,
        },
      };
    });

    const { loading, onResult, refetch } = useQuery(
      GET_ALL_TASKS,
      requestVariables,
    );

    onResult((response) => {
      if (response.data) {
        tasks.value = (response.data.getAllTasks.items ?? []).map(
          (task: Task) => ({
            ...task,
            description: task.description ?? "",
          }),
        );
        profileStore.addAuthors(
          (response.data.getAllTasks.items ?? []).map((task: Task) => task.author),
        );
        totalCount.value = response.data.getAllTasks.pagination?.totalCount ?? tasks.value.length;
      }
    });

    watch([page, pageSize], () => {
      refetch(requestVariables.value);
    });

    watch(pageSize, () => {
      page.value = 1;
    });

    let filterTimeout: number | undefined;

    watch(
        () => taskStore.taskFilter.appliedAt,
        () => {
          // «Найти»/«Сбросить» в карточке фильтра — выходим из векторного
          // режима и перезапрашиваем список с бэкенда.
          if (vectorQuery.value || vectorResults.value) {
            vectorQuery.value = "";
            vectorResults.value = null;
          }
          if (filterTimeout) {
            window.clearTimeout(filterTimeout);
          }
          filterTimeout = window.setTimeout(() => {
            if (page.value !== 1) {
              page.value = 1;
            } else {
              refetch(requestVariables.value);
            }
          }, 300);
        },
    );

    // Векторный поиск: запрос только в сервис на localhost, GraphQL не трогаем.
    const vectorQuery = ref("");
    const vectorLoading = ref(false);
    const vectorResults = ref<Task[] | null>(null);

    const displayItems = computed(
        () => vectorResults.value ?? tasks.value,
    );
    const displayTotal = computed(() =>
        vectorResults.value ? vectorResults.value.length : totalCount.value,
    );

    const pageCount = computed(() =>
        Math.max(1, Math.ceil(displayTotal.value / pageSize.value)),
    );

    const groupedItems = computed(() => {
      const groups = new Map<string, Task[]>();
      for (const task of displayItems.value) {
        const category = task.category || "Без категории";
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push(task);
      }
      return Array.from(groups.entries()).map(([category, items]) => ({
        category,
        items,
      }));
    });

    let vectorTimeout: number | undefined;

    watch(vectorQuery, (value) => {
      if (vectorTimeout) {
        window.clearTimeout(vectorTimeout);
      }
      vectorTimeout = window.setTimeout(async () => {
        const query = (value || "").trim();
        if (!query) {
          vectorResults.value = null;
          refetch(requestVariables.value);
          return;
        }
        // Ввод в векторный поиск сбрасывает карточку фильтра без
        // перезапроса: appliedAt не меняем.
        taskStore.taskFilter = {
          name: "",
          description: "",
          category: "",
          taskType: "",
          authorId: "",
          isPublic: false,
          isFiltered: false,
          appliedAt: taskStore.taskFilter.appliedAt,
        };
        vectorLoading.value = true;
        try {
          const found = await searchTasks(query, 10);
          vectorResults.value = found.map((item) => ({
            ...item,
            description: item.description ?? "",
          })) as unknown as Task[];
        } catch (error) {
          console.error("Векторный поиск недоступен:", error);
          vectorResults.value = [];
        } finally {
          vectorLoading.value = false;
        }
      }, 300);
    });

    const formatAuthor = (author?: Profile | null) => {
      if (!author) return "-";
      const fullName = [author.lastName, author.firstName, author.patronymic]
        .filter((part) => part && part.length > 0)
        .join(" ");
      return fullName || author.email;
    };

    const taskTypeMeta = (taskType?: string | null) =>
      (taskType && TASK_TYPE_META[taskType]) || { label: "Задача", icon: "mdi-help-circle-outline" };

    const taskTypeLabel = (taskType?: string | null) => taskTypeMeta(taskType).label;
    const taskTypeIcon = (taskType?: string | null) => taskTypeMeta(taskType).icon;

    return {
      vectorQuery,
      vectorLoading,
      vectorResults,
      displayItems,
      displayTotal,
      pageCount,
      groupedItems,
      tasks,
      loading,
      totalCount,
      page,
      pageSize,
      formatAuthor,
      taskTypeLabel,
      taskTypeIcon,
      profileStore,
    };
  },
  computed: {
    isUserAdmin(): boolean {
      return this.profileStore.activeUser?.role === "ADMIN";
    },
  },
  methods: {
    solveTask(task: Task) {
      if (task.taskType === TaskType.Graph) {
        this.$router.push("/tasks/graph/" + task.id);
      } else {
        this.$router.push("/tasks/implementation/" + task.id);
      }
    },
    async deleteTask(task: Task) {
      try {
        const { mutate } = useMutation(DELETE_TASK);
        await mutate({ id: task.id });
        this.tasks = this.tasks.filter((item: Task) => item.id !== task.id);
      } catch (error) {
        console.error("Ошибка при удалении задачи:", error);
      }
    },
  },
});
</script>

<style>
@import "@/components/common/listViewStyles.css";
</style>
