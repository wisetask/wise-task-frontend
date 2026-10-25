<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>{{ activeTask.name }}</v-card-title>
          <v-card-text>
            <v-col>
              {{ activeTask.description }}
            </v-col>
            <v-file-input
              label="Jar файл"
              v-model="jarFileModel"
            ></v-file-input>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" variant="outlined" @click="solveTask">
              Отправить решение
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-alert
          v-model="successAlert"
          text="Задача решена верно"
          title="Успех!"
          type="success"
          closable
          variant="tonal"
        ></v-alert>
        <v-alert
          v-model="errorAlert"
          text="В решении есть ошибка"
          title="Ошибка!"
          type="error"
          closable
          variant="tonal"
        ></v-alert>
        <v-alert
          v-model="pluginErrorAlert"
          type="error"
          title="Плагин совершил ошибку выполнения"
          closable
          variant="tonal"
        >
          <span class="text-pre-wrap">{{ pluginErrorReason }}</span>
        </v-alert>
        <v-card v-if="successAlert || errorAlert">
          <v-card-title>Результаты тестов</v-card-title>
          <v-card-text>
            <v-list lines="one">
              <v-list-item v-for="(item, i) in result" :key="i" :value="item">
                <template v-slot:prepend>
                  <v-chip
                    class="ma-2"
                    v-if="item.originalResult === item.result"
                    color="success"
                  >
                    {{ i + 1 }}
                  </v-chip>
                  <v-chip class="ma-2" v-else color="error">
                    {{ i + 1 }}
                  </v-chip>
                </template>
                <v-list-item-title
                  v-text="
                    'Результат = ' +
                    item.result +
                    ', время = ' +
                    item.timeResult +
                    'ns, результат эталона = ' +
                    item.originalResult +
                    ', время эталона = ' +
                    item.originalTimeResult +
                    'ns'
                  "
                ></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
        <v-card class="mt-4">
          <v-card-text class="py-3">
            <div v-if="taskStatsLoading" class="d-flex align-center justify-center">
              <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
              <span class="text-caption">Загрузка...</span>
            </div>
            <v-row v-else no-gutters class="text-center">
              <v-col>
                <div class="text-h6 font-weight-bold">{{ formatCount(taskStats.submits) }}</div>
                <div class="text-caption">отправок</div>
              </v-col>
              <v-col>
                <div class="text-h6 font-weight-bold text-success">{{ formatCount(taskStats.solved) }}</div>
                <div class="text-caption">решили верно</div>
              </v-col>
              <v-col>
                <div class="text-h6 font-weight-bold">{{ formatCount(taskStats.opened) }}</div>
                <div class="text-caption">открытий</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { SOLVE_TASK_IMPLEMENTATION } from "@/api/Mutations";
import { GET_TASK, GET_STATISTIC } from "@/api/Queries";
import { useTaskStore } from "@/store/task";
import { useMutation, useQuery, useApolloClient } from "@vue/apollo-composable";
import { storeToRefs } from "pinia";
import { defineComponent, ref } from "vue";
import { getUserFromToken } from "@/entities/user/lib/getUserFromToken";
import { extractPluginExecutionError } from "@/shared/lib/pluginExecutionError";
import { useEventsApi } from "@/api/rest/Events";

interface TaskStats {
  submits: number | null;
  solved: number | null;
  opened: number | null;
}

export default defineComponent({
  props: {
    id: String,
    onCorrectSolution: {
      type: Function,
      default: null,
    },
  },
  setup(props) {
    const { activeTask } = storeToRefs(useTaskStore());
    const { onResult } = useQuery(GET_TASK, { id: props.id });
    const token = localStorage.getItem("token");
    const userInfo = getUserFromToken(token);          
    const NULL_UUID = "00000000-0000-0000-0000-000000000000";
    const authorId = userInfo?.id ?? NULL_UUID;

    const eventsApi = useEventsApi();
    if (token) {
      eventsApi.setToken(token);
    }

    const sendEvent = async (eventType: string, eventValue: string) => {
      try {
        if (!activeTask.value?.id) return;
        await eventsApi.createEvent({
          taskId: activeTask.value.id,
          eventType,
          eventEntityId: 0,
          eventValue,
        });
      } catch (e) {
        console.error("Event error:", eventType, e);
      }
    };

    onResult((response) => {
      if (response.data) {
        activeTask.value = response.data.getTask;
        sendEvent(
          "open_task",
          `Пользователь открыл задачу ${response.data.getTask.id}`,
        );
      }
    });

    const { client: apolloClient } = useApolloClient();
    const taskStats = ref<TaskStats>({
      submits: null,
      solved: null,
      opened: null,
    });
    const taskStatsLoading = ref(false);

    const fetchTaskStat = (
      taskId: string,
      eventType: string,
    ): Promise<number | null> =>
      apolloClient
        .query({
          query: GET_STATISTIC,
          variables: {
            request: {
              type: "SUM",
              scope: "TASK",
              event_type: eventType,
              task_id: taskId,
            },
          },
          fetchPolicy: "no-cache",
        })
        .then((response) => response.data?.getStatistic?.value ?? null)
        .catch((error) => {
          console.error("Ошибка загрузки статистики:", eventType, error);
          return null;
        });

    const loadTaskStats = () => {
      const taskId = activeTask.value?.id;
      if (!taskId) return;

      taskStatsLoading.value = true;
      Promise.all([
        fetchTaskStat(taskId, "submit"),
        fetchTaskStat(taskId, "task_success"),
        fetchTaskStat(taskId, "open_task"),
      ])
        .then(([submits, solved, opened]) => {
          taskStats.value = { submits, solved, opened };
        })
        .finally(() => {
          taskStatsLoading.value = false;
        });
    };

    const formatCount = (value: number | null) =>
      value == null ? "—" : String(Math.round(value));

    return {
      activeTask,
      authorId,
      sendEvent,
      taskStats,
      taskStatsLoading,
      loadTaskStats,
      formatCount,
    };
  },
  data() {
    return {
      successAlert: false,
      errorAlert: false,
      pluginErrorAlert: false,
      pluginErrorReason: "",
      result: [],
      jarFileModel: [],
    };
  },
  methods: {
    toBase64(file: File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    },
    async solveTask() {
      const { mutate, onDone, onError } = useMutation(
        SOLVE_TASK_IMPLEMENTATION,
      );
      const jarFile = (
        (await this.toBase64(this.jarFileModel[0])) as string
      ).replace("data:application/x-java-archive;base64,", "");
      const request = {
        solution: {
          id: self.crypto.randomUUID(),
          taskId: this.activeTask.id,
          authorId: this.authorId,
          code: jarFile,
        },
      };

      this.sendEvent("submit", "Пользователь отправил решение");

      mutate(request);

      onDone((response) => {
        if (response.data) {
          this.pluginErrorAlert = false;
          if (response.data.solveTaskImplementation.isCorrect) {
            this.successAlert = true;
            this.errorAlert = false;
            this.sendEvent("task_success", "Задача решена успешно");
            if (this.onCorrectSolution) {
              this.onCorrectSolution();
            }
          } else {
            this.errorAlert = true;
            this.successAlert = false;
            this.sendEvent("task_wrong", "Задача решена неверно");
          }
          this.result =
            response.data.solveTaskImplementation.implementationResult;
          console.log(response.data);
          this.loadTaskStats();
        }
      });

      onError((error) => {
        this.successAlert = false;

        const pluginError = extractPluginExecutionError(error);
        if (pluginError) {
          this.pluginErrorReason = pluginError.reason;
          this.pluginErrorAlert = true;
          this.errorAlert = false;
          return;
        }

        if (error.graphQLErrors) {
          error.graphQLErrors.map(({ message }) => {
            console.error(message);
          });
        }
        this.errorAlert = true;
      });
    },
  },
});
</script>

<style scoped>
.text-pre-wrap {
  white-space: pre-wrap;
}
</style>
