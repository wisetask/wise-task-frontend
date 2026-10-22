<template>
  <v-card>
    <v-card-text class="d-flex justify-end pb-0">
      <v-btn color="primary" @click="addPlugin" icon="mdi-plus" variant="tonal" />
    </v-card-text>
    <v-data-table-server
        :headers="headers"
        :items="plugins"
        :group-by="groupBy"
        :loading="loading"
        :items-length="totalCount"
        v-model:page="page"
        v-model:items-per-page="pageSize"
        :items-per-page-options="[5, 10, 25, 50, 100]"
    >
      <template #header.name="{ column }">
        <table-header-filter :title="column.title" v-model="filters.name" />
      </template>
      <template #header.description="{ column }">
        <table-header-filter :title="column.title" v-model="filters.description" />
      </template>
      <template #header.category="{ column }">
        <table-header-filter :title="column.title" v-model="filters.category" />
      </template>
      <template #header.isValid="{ column }">
        <table-header-filter
            :title="column.title"
            v-model="filters.isValid"
            :items="['true', 'false']"
        />
      </template>
      <template #header.graphType="{ column }">
        <table-header-filter
            :title="column.title"
            v-model="filters.graphType"
            :items="['DIRECT', 'UNDIRECT', 'ANY']"
        />
      </template>
      <template v-slot:item.isValid="{ item }">
        <v-chip :color="item.isValid ? 'success' : 'warning'" size="small">
          {{ item.isValid ? 'Да' : 'Нет' }}
        </v-chip>
      </template>
      <template v-slot:item.author="{ item }">
        {{ formatAuthor(item.author) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon class="me-2" size="small" @click="editPlugin(item)">
          mdi-pencil
        </v-icon>
        <v-icon
            v-if="isUserAdmin"
            class="me-2"
            size="small"
            @click="deletePlugin(item)"
        >
          mdi-delete
        </v-icon>
        <v-icon
            v-if="isUserAdmin"
            class="me-2"
            size="small"
            @click="approvePlugin(item)"
        >
          mdi-check-decagram
        </v-icon>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script lang="ts">
import { DELETE_PLUGIN, VALIDATE_PLUGIN } from "@/api/Mutations";
import { GET_ALL_PLUGINS } from "@/api/Queries";
import { usePluginStore } from "@/store/plugin";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { storeToRefs } from "pinia";
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";
import { useProfileStore } from "@/store/profile";
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser";
import { Plugin as GraphQLPlugin, Profile } from "@/__generated__/graphql";
import { bulkIndexPlugins } from "@/services/semanticSearchApi";

export default defineComponent({
  setup() {
    const { plugins, dialog, pluginInput } =
        storeToRefs(usePluginStore());
    const profileStore = useProfileStore();

    onMounted(() => {
      ensureActiveUser();
    });

    const totalCount = ref(0);
    const page = ref(1);
    const pageSize = ref(10);

    const headers = [
      { key: "name", title: "Название" },
      { key: "description", title: "Описание" },
      { key: "category", title: "Категория" },
      { key: "isValid", title: "Одобрен" },
      { key: "graphType", title: "Тип графа" },
      { key: "author", title: "Автор", sortable: false },
      { key: "actions", title: "Действия", sortable: false },
    ];

    const filters = reactive({
      name: "",
      description: "",
      category: "",
      isValid: "",
      graphType: "",
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
          description: filters.description || undefined,
          category: filters.category || undefined,
          isValid: filters.isValid === "" ? undefined : filters.isValid === "true",
          graphType: filters.graphType || undefined,
        },
      },
    }));

    const { loading, onResult, refetch } = useQuery(
        GET_ALL_PLUGINS,
        requestVariables,
    );

    onResult((response) => {
      if (response.data) {
        plugins.value = response.data.getAllPlugins.items ?? [];
        totalCount.value =
            response.data.getAllPlugins.pagination?.totalCount ??
            plugins.value.length;

        bulkIndexPlugins(
            plugins.value.map((plugin) => ({
              id: plugin.id,
              name: plugin.name,
              description: plugin.description ?? "",
              category: plugin.category ?? "",
              graphType: plugin.graphType ?? "",
              pluginType: plugin.pluginType ?? "",
            })),
        ).catch((error) =>
            console.error("Failed to sync plugins with semantic search", error),
        );
      }
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

    watch([page, pageSize], () => {
      refetch(requestVariables.value);
    });

    const formatAuthor = (author?: Profile | null) => {
      if (!author) return "-";
      const fullName = [author.lastName, author.firstName, author.patronymic]
          .filter((part) => part && part.length > 0)
          .join(" ");
      return fullName || author.email;
    };

    return {
      plugins,
      profileStore,
      headers,
      loading,
      totalCount,
      page,
      pageSize,
      filters,
      formatAuthor,
      groupBy,
      dialog,
      pluginInput,
    };
  },
  computed: {
    isUserAdmin(): boolean {
      return this.profileStore.activeUser?.role === "ADMIN";
    },
  },
  methods: {
    editPlugin(plugin: GraphQLPlugin) {
      this.pluginInput = {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        category: plugin.category,
        graphType: plugin.graphType,
        pluginType: plugin.pluginType,
      };
      this.dialog = true;
    },
    async deletePlugin(plugin: GraphQLPlugin) {
      try {
        const { mutate } = useMutation(DELETE_PLUGIN);
        await mutate({ id: plugin.id });
        this.plugins = this.plugins.filter(
            (item: GraphQLPlugin) => item.id !== plugin.id,
        );
      } catch (error) {
        console.error("Ошибка при удалении плагина:", error);
      }
    },
    async approvePlugin(plugin: GraphQLPlugin) {
      try {
        const { mutate } = useMutation(VALIDATE_PLUGIN);
        await mutate({ id: plugin.id });

        const index = this.plugins.findIndex(
            (item: GraphQLPlugin) => item.id === plugin.id,
        );
        if (index !== -1) {
          this.plugins = [
            ...this.plugins.slice(0, index),
            { ...this.plugins[index], isValid: true },
            ...this.plugins.slice(index + 1),
          ] as GraphQLPlugin[];
        }
      } catch (error) {
        console.error("Ошибка при подтверждении плагина:", error);
      }
    },
    addPlugin() {
      this.dialog = true;
    },
  },
});
</script>