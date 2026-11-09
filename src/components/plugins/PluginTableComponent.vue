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
      <v-btn color="#1976d2" variant="flat" icon="mdi-plus" @click="addPlugin" />
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
          <v-col v-for="plugin in group.items" :key="plugin.id" cols="12" sm="6" md="4" xl="3">
            <div class="lv-card">
              <div class="lv-card__header">
                <span class="lv-card__icon">
                  <v-icon size="20" icon="mdi-puzzle-outline" />
                </span>
                <div class="lv-card__title" :title="plugin.name">{{ plugin.name }}</div>
                <v-chip :color="plugin.isValid ? 'success' : 'warning'" size="x-small" variant="tonal">
                  {{ plugin.isValid ? 'Одобрен' : 'Не одобрен' }}
                </v-chip>
              </div>

              <p class="lv-card__text">{{ plugin.description }}</p>

              <div class="lv-card__chips">
                <v-chip v-if="plugin.category" size="x-small" variant="tonal" color="blue">
                  {{ plugin.category }}
                </v-chip>
                <v-chip size="x-small" variant="tonal" color="indigo">
                  {{ graphTypeLabel(plugin.graphType) }}
                </v-chip>
              </div>

              <div class="lv-card__row">
                <v-icon size="14" icon="mdi-account-outline" />
                <span class="lv-card__row-text">{{ formatAuthor(plugin.author) }}</span>
              </div>

              <div class="lv-card__footer">
                <v-btn size="small" variant="text" color="#1976d2" icon="mdi-pencil" @click="editPlugin(plugin)" />
                <v-btn v-if="isUserAdmin" size="small" variant="text" color="#43a047" icon="mdi-check-decagram"
                    @click="approvePlugin(plugin)" />
                <v-spacer />
                <v-btn v-if="isUserAdmin" size="small" variant="text" color="#e53935" icon="mdi-delete"
                    @click="deletePlugin(plugin)" />
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
          :items="[16, 32, 64, 100]"
          label="На странице"
          density="comfortable"
          variant="outlined"
          hide-details
          class="lv-page-size"
      />
    </div>

    <v-snackbar
        v-model="validateErrorSnackbar"
        multi-line
        timeout="8000"
        color="error"
        location="bottom right"
    >
      {{ validateErrorMessage }}
    </v-snackbar>
  </div>
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
import { GraphType, Plugin as GraphQLPlugin, Profile } from "@/__generated__/graphql";
import { searchPlugins } from "@/services/semanticSearchApi";
import { extractPluginExecutionError } from "@/shared/lib/pluginExecutionError";

const GRAPH_TYPE_LABELS: Record<string, string> = {
  [GraphType.Direct]: "Направленный",
  [GraphType.Undirect]: "Неориентированный",
  [GraphType.Any]: "Любой",
};

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
    const pageSize = ref(16);

    const validateErrorSnackbar = ref(false);
    const validateErrorMessage = ref("");

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

    const pageCount = computed(() =>
        Math.max(1, Math.ceil(displayTotal.value / pageSize.value)),
    );

    const groupedItems = computed(() => {
      const groups = new Map<string, GraphQLPlugin[]>();
      for (const plugin of displayItems.value) {
        const category = plugin.category || "Без категории";
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category)!.push(plugin);
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

    watch(pageSize, () => {
      page.value = 1;
    });

    const formatAuthor = (author?: Profile | null) => {
      if (!author) return "-";
      const fullName = [author.lastName, author.firstName, author.patronymic]
          .filter((part) => part && part.length > 0)
          .join(" ");
      return fullName || author.email;
    };

    const graphTypeLabel = (graphType?: string | null) =>
      (graphType && GRAPH_TYPE_LABELS[graphType]) || "Любой";

    return {
      vectorQuery,
      vectorLoading,
      vectorResults,
      displayItems,
      displayTotal,
      pageCount,
      groupedItems,
      plugins,
      profileStore,
      validateErrorSnackbar,
      validateErrorMessage,
      loading,
      totalCount,
      page,
      pageSize,
      formatAuthor,
      graphTypeLabel,
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
        const pluginError = extractPluginExecutionError(error);
        this.validateErrorMessage = pluginError
            ? `Плагин совершил ошибку выполнения:\n${pluginError.reason}`
            : "Не удалось подтвердить плагин.";
        this.validateErrorSnackbar = true;
      }
    },
    addPlugin() {
      this.dialog = true;
    },
  },
});
</script>

<style>
@import "@/components/common/listViewStyles.css";
</style>
