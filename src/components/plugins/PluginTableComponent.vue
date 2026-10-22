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
        ></v-text-field>
        <v-btn class="ma-2" @click="addPlugin" icon="mdi-plus" />
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
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { useProfileStore } from "@/store/profile";
import { ensureActiveUser } from "@/entities/user/lib/ensureActiveUser";
import { Plugin as GraphQLPlugin, Profile } from "@/__generated__/graphql";
import { searchPlugins } from "@/services/semanticSearchApi";

export default defineComponent({
  setup() {
    const { plugins, dialog, pluginInput, pluginFilter } =
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

    const groupBy = [
      {
        key: "category",
        order: "asc" as const,
      },
    ];

    const requestVariables = computed(() => {
      // Поля PluginFilterInput; незаполненные уходят как undefined,
      // чтобы бэкенд не фильтровал по ним. Векторный поиск сюда не
      // попадает: он ходит только в сервис на localhost.
      const filter: Record<string, unknown> = {};
      if (pluginFilter.value.isFiltered) {
        const f = pluginFilter.value;
        filter.name = f.name || undefined;
        filter.description = f.description || undefined;
        filter.category = f.category || undefined;
        filter.graphType = f.graphType || undefined;
        filter.pluginType = f.pluginType || undefined;
        filter.isInternal = f.isInternal;
        filter.isValid = f.isValid;
        filter.authorId = f.authorId || undefined;
      }
      return {
        request: {
          pagination: {
            page: page.value - 1,
            pageSize: pageSize.value,
          },
          filter,
        },
      };
    });

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

        profileStore.addAuthors(
            (response.data.getAllPlugins.items ?? []).map(
                (plugin: GraphQLPlugin) => plugin.author,
            ),
        );
      }
    });

    let filterTimeout: number | undefined;

    watch(
        () => pluginFilter.value.appliedAt,
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
    const vectorResults = ref<GraphQLPlugin[] | null>(null);

    const displayItems = computed(
        () => vectorResults.value ?? plugins.value,
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
        pluginFilter.value = {
          name: "",
          description: "",
          category: "",
          graphType: "",
          pluginType: "",
          isInternal: false,
          authorId: "",
          isValid: false,
          isFiltered: false,
          appliedAt: pluginFilter.value.appliedAt,
        };
        vectorLoading.value = true;
        try {
          const found = await searchPlugins(query, 10);
          vectorResults.value = found.map((item) => ({
            ...item,
            isValid: false,
            author: null,
          })) as unknown as GraphQLPlugin[];
        } catch (error) {
          console.error("Векторный поиск недоступен:", error);
          vectorResults.value = [];
        } finally {
          vectorLoading.value = false;
        }
      }, 300);
    });

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
      vectorQuery,
      vectorLoading,
      displayItems,
      displayTotal,
      plugins,
      profileStore,
      headers,
      loading,
      totalCount,
      page,
      pageSize,
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