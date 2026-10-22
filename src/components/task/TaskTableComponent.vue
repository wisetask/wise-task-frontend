<template>
  <v-card>
    <v-data-table-server
      :headers="headers"
      :items="tasks"
      :group-by="groupBy"
      :loading="loading"
      :items-length="totalCount"
      v-model:page="page"
      v-model:items-per-page="pageSize"
      :items-per-page-options="[5, 10, 25, 50, 100]"
    >
      <template #header.name="{ column }">
        <table-header-filter
          :title="column.title"
          v-model="filters.name"
        />
      </template>
      <template #header.category="{ column }">
        <table-header-filter
          :title="column.title"
          v-model="filters.category"
        />
      </template>
      <template #header.taskType="{ column }">
        <table-header-filter
          :title="column.title"
          v-model="filters.taskType"
          :items="['GRAPH', 'IMPLEMENTATION']"
        />
      </template>
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
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useTaskStore } from "@/store/task";
import { Profile, Task, TaskType } from "@/__generated__/graphql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_ALL_TASKS } from "@/api/Queries";
import { DELETE_TASK } from "@/api/Mutations";
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser";
import { useProfileStore } from "@/store/profile";

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

    const filters = reactive({
      name: "",
      category: "",
      taskType: "",
    });

    const groupBy = [
      {
        key: "category",
        order: "asc" as const,
      },
    ];

    const requestVariables = computed(() => ({
      request: {
        pagination: {
          page: page.value - 1,
          pageSize: pageSize.value,
        },
        filter: {
          name: filters.name || undefined,
          category: filters.category || undefined,
          taskType: filters.taskType || undefined,
        },
      },
    }));

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
        totalCount.value = response.data.getAllTasks.pagination?.totalCount ?? tasks.value.length;
      }
    });

    watch([page, pageSize], () => {
      refetch(requestVariables.value);
    });

    let filterTimeout: number | undefined;

    watch(filters, () => {
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
    }, { deep: true });

    const formatAuthor = (author?: Profile | null) => {
      if (!author) return "-";
      const fullName = [author.lastName, author.firstName, author.patronymic]
        .filter((part) => part && part.length > 0)
        .join(" ");
      return fullName || author.email;
    };

    return {
      groupBy,
      headers,
      tasks,
      loading,
      totalCount,
      page,
      pageSize,
      filters,
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
