<template>
  <v-card>
    <template v-slot:text>
      <v-row>
        <v-text-field
            v-model="vectorQuery"
            label="Векторный поиск"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            hide-details
            single-line
            clearable
        />
      </v-row>
    </template>
    <v-data-table-server
      :headers="headers"
      :items="displayItems"
      :group-by="groupBy"
      :loading="loading || vectorLoading"
      :items-length="displayTotal"
      v-model:page="page"
      v-model:items-per-page="pageSize"
      :items-per-page-options="[5, 10, 25, 50, 100]"
    >
      <template v-slot:item.solve="{ item }">
        <v-icon class="me-2" size="small" @click="solveTask(item)">
          mdi-school
        </v-icon>
      </template>
      <template v-slot:item.author="{ item }">
        {{ formatAuthor(item.author) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
            v-if="isUserAdmin"
            class="me-2"
            size="small"
            @click="deleteTask(item)"
        >
          mdi-delete
        </v-icon>
      </template>
    </v-data-table-server>
  </v-card>
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

    const headers = [
      { key: "name", title: "Название" },
      { key: "category", title: "Категория" },
      { key: "taskType", title: "Тип" },
      { key: "author", title: "Автор", sortable: false },
      { key: "solve", title: "Решить задачу", sortable: false },
      { key: "actions", title: "Действия", sortable: false },
    ];

    const groupBy = [
      {
        key: "category",
        order: "asc" as const,
      },
    ];

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

    return {
      vectorQuery,
      vectorLoading,
      displayItems,
      displayTotal,
      groupBy,
      headers,
      tasks,
      loading,
      totalCount,
      page,
      pageSize,
      formatAuthor,
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
