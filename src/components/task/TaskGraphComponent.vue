<template>
    <v-layout>
        <div style="position: relative; width: 100%; height: 100vh">
            <Graph :style="{
                width: '100%',
                height: '100%',
                border: '1px solid black',
                boxSizing: 'border-box',
            }" />

            <v-btn v-if="!drawer" icon class="drawer-toggle-btn" @click="drawer = true">
                <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
        </div>

        <v-navigation-drawer v-model="drawer" location="right" temporary :width="drawerWidth">
            <div class="d-flex justify-end pa-2">
                <v-btn icon @click="drawer = false">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </div>

            <v-container>
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-title>{{ activeTask.name }}</v-card-title>
                            <v-card-text class="text-pre-wrap" v-html="formatDescription(activeTask.description)" />
                            <v-card-actions>
                                <v-btn color="primary" variant="outlined" @click="solveTask">
                                    Отправить решение
                                </v-btn>
                            </v-card-actions>

                            <v-card v-if="extraGraph && extraGraph.vertexList.length !== 0" class="mt-4">
                                <v-card-text>
                                    <v-network-graph :style="{
                                        width: '100%',
                                        height: '500px',
                                        border: '1px solid #000',
                                    }" :nodes="graphData.nodes" :edges="graphData.edges" :layouts="graphData.layouts"
                                        :configs="graphConfigs">
                                        <template #override-node="{ nodeId, ...props }">
                                            <circle :r="20" :fill="getColorCode(props.config.color)" stroke="#000"
                                                stroke-width="1" />
                                            <text v-if="graphData.nodes[nodeId].weight !== undefined" font-size="12"
                                                text-anchor="middle" fill="#000000" y="45">
                                                Вес: {{ graphData.nodes[nodeId].weight }}
                                            </text>
                                            <text font-size="12" text-anchor="middle" fill="#000000" y="30">
                                                {{ graphData.nodes[nodeId].label }}
                                            </text>
                                            <text font-size="12" text-anchor="middle" fill="#000000" y="60">
                                                Координаты: ({{ graphData.nodes[nodeId].xCoordinate }},
                                                {{ graphData.nodes[nodeId].yCoordinate }})
                                            </text>
                                        </template>
                                        <template #edge-label="{ edgeId, ...slotProps }">
                                            <v-edge-label :text="`${graphData.edges[edgeId].weight}`" align="center"
                                                vertical-align="below" v-bind="slotProps" />
                                            <v-edge-label :text="`${graphData.edges[edgeId].label}`" align="center"
                                                vertical-align="above" v-bind="slotProps" />
                                        </template>
                                    </v-network-graph>
                                </v-card-text>
                            </v-card>
                        </v-card>

                        <v-alert v-model="successAlert" text="Задача решена верно" title="Успех!" type="success"
                            closable variant="tonal" />
                        <v-alert v-model="errorAlert" text="В решении есть ошибка" title="Ошибка!" type="error" closable
                            variant="tonal" />

                        <v-card v-if="errorAlert">
                            <v-card-title>Ошибки в модулях</v-card-title>
                            <v-card-text>
                                <v-list lines="one">
                                    <v-list-item v-for="(item, i) in result" :key="i"
                                        :title="`${i + 1}. ${item.mistakeText} = ${item.value}`" />
                                </v-list>
                            </v-card-text>
                        </v-card>

                        <v-card class="mt-4">
                            <v-card-text class="text-center">
                                <div v-if="statisticLoading" class="d-flex align-center justify-center">
                                    <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
                                    <span class="text-caption">Загрузка...</span>
                                </div>
                                <div v-else-if="statistic">
                                    <div class="text-h5 font-weight-bold primary--text mb-1">
                                        {{ formatPercentage(statistic.value) }}
                                    </div>
                                    <div class="text-body-2">успешно решили задачу</div>
                                </div>
                                <div v-else class="text-body-2">
                                    Ошибка загрузки сервиса статистики
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-navigation-drawer>
    </v-layout>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { SOLVE_TASK_GRAPH } from "@/api/Mutations";
import { GET_GRAPH_BY_ID, GET_TASK, GET_STATISTIC } from "@/api/Queries";
import { StatisticRequestInput, StatisticResponse } from "@/api/Statistic";
import { useTaskStore } from "@/store/task";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { storeToRefs } from "pinia";
import { PluginResult, Graph as GraphType } from "@/__generated__/graphql";
import Graph from "@/features/graph/ui/graph/Graph.vue";
import { useNodeStore } from "@/features/graph/stores/nodes";
import { convertToGqlFormat } from "@/features/graph/lib/helpers/GqlFormatter";
import * as vNG from "v-network-graph";
import undirectGraphConfigs, {
  directGraphConfigs,
} from "@/components/graph/network/helper/graphConfig";
import { useEventsApi } from "@/api/rest/Events";
import { getUserFromToken } from "@/entities/user/lib/getUserFromToken";

const props = defineProps({
  id: String,
  onCorrectSolution: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["isCorrect"]);

const taskStore = useTaskStore();
const nodeStore = useNodeStore();
const { activeTask } = storeToRefs(taskStore);


const eventsApi = useEventsApi();
const token = localStorage.getItem("token");
const userInfo = getUserFromToken(token)
const NULL_UUID = "00000000-0000-0000-0000-000000000000";
const authorId = userInfo?.id ?? NULL_UUID

if (token) {
  eventsApi.setToken(token);
}

const sendEvent = async (
  eventType: string,
  eventValue: string,
  entityId: number = 0,
) => {
  try {
    if (!activeTask.value?.id) return;
    await eventsApi.createEvent({
      taskId: activeTask.value.id,
      eventType,
      eventEntityId: entityId,
      eventValue,
    });
  } catch (e) {
    console.error("Event error:", eventType, e);
  }
};


const successAlert = ref(false);
const errorAlert = ref(false);
const result = ref<PluginResult[]>([]);
const extraGraph = ref<null | GraphType>(null);
const drawer = ref(true);
const drawerWidth = ref(600);
const statistic = ref<StatisticResponse | null>(null);
const statisticLoading = ref(false);

const updateDrawerWidth = () => {
  drawerWidth.value = Math.max(600, window.innerWidth / 2);
};

onMounted(() => {
  updateDrawerWidth();
  window.addEventListener("resize", updateDrawerWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateDrawerWidth);
});

const loadStatisticForTask = (taskId: string) => {
  if (!taskId) return;

  statisticLoading.value = true;

  const request: StatisticRequestInput = {
    type: "SUCCESS_RATE",
    scope: "TASK",
    event_type: "task_success,task_wrong",
    task_id: taskId,
  };

  const { onResult } = useQuery(
    GET_STATISTIC,
    { request },
    { fetchPolicy: "cache-first" },
  );

  onResult((result) => {
    if (result.data?.getStatistic) {
      statistic.value = result.data.getStatistic;
    }
    statisticLoading.value = false;
  });
};

const getColorCode = (color: string) => {
  switch (color) {
    case "RED":
      return "#ff0000";
    case "GREEN":
      return "#00ff00";
    case "BLUE":
      return "#0000ff";
    case "GRAY":
    default:
      return "#808080";
  }
};

const formatDescription = (description: string) => {
  if (!description) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return description.replace(urlRegex, (url) => {
    const escapedUrl = url
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
  });
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};


const graphData = computed(() => {
  if (!extraGraph.value) {
    return {
      nodes: {},
      edges: {},
      layouts: {
        nodes: {},
      },
    };
  }

  const nodes: vNG.Nodes = {};
  const layouts: vNG.Layouts = { nodes: {} };

  extraGraph.value.vertexList.forEach((vertex) => {
    if (!vertex) return;
    nodes[vertex.id] = {
      label: String(vertex.label),
      weight: vertex.weight,
      color: vertex.color,
      xCoordinate: vertex.xCoordinate,
      yCoordinate: vertex.yCoordinate,
    };
    layouts.nodes[vertex.id] = {
      x: vertex.xCoordinate,
      y: vertex.yCoordinate,
    };
  });

  const edges: vNG.Edges = {};
  extraGraph.value.edgeList.forEach((edge, index) => {
    if (!edge) return;
    edges[`edge${index}`] = {
      source: String(edge.source),
      target: String(edge.target),
      label: edge.label,
      weight: edge.weight,
      color: edge.color,
    };
  });

  return { nodes, edges, layouts };
});


const graphConfigs = computed(() => {
  const config = extraGraph.value?.isDirect
    ? directGraphConfigs
    : undirectGraphConfigs;

  return {
    ...config,
    node: {
      ...config.node,
      color: (node: any) => {
        const vertex = extraGraph.value?.vertexList.find(
          (v) => v?.id === node.id,
        );
        return getColorCode(vertex?.color || "GRAY");
      },
      label: {
        ...config.node?.label,
        color: "#000000",
      },
    },
    edge: {
      ...config.edge,
      color: (edge: any) => {
        const edgeData = extraGraph.value?.edgeList.find(
          (e) => e?.source === edge.source && e?.target === edge.target,
        );
        return getColorCode(edgeData?.color || "GRAY");
      },
    },
  };
});


const { onResult: onTaskResult } = useQuery(GET_TASK, {
  id: props.id,
});

onTaskResult((response) => {
  if (response.data) {
    activeTask.value = response.data.getTask;
    sendEvent(
      "open_task",
      `Пользователь открыл задачу ${response.data.getTask.id}`,
    );
  }
});


watch(
  activeTask,
  (newValue) => {
    if (!newValue?.graph?.id) return;

    const { onResult: onGraphResult } = useQuery(GET_GRAPH_BY_ID, {
      id: newValue.graph.id,
    });

    onGraphResult((response) => {
      extraGraph.value = response.data.getGraphById;
    });

    if (newValue?.id) {
      loadStatisticForTask(newValue.id);
    }
  },
  { immediate: true },
);


const previousGraphState = ref({
  nodes: [] as string[],
  edges: [] as string[],
});

watch(
  () => convertToGqlFormat(nodeStore),
  (graph) => {
    if (!graph) return;


    const currentNodeIds =
      graph.vertexList?.map((v: any) => String(v.id)) || [];
    const addedNodes = currentNodeIds.filter(
      (id) => !previousGraphState.value.nodes.includes(id),
    );
    const removedNodes = previousGraphState.value.nodes.filter(
      (id) => !currentNodeIds.includes(id),
    );

    addedNodes.forEach((id) => {
      sendEvent("node_add", `Добавлена нода ${id}`);
    });
    removedNodes.forEach((id) => {
      sendEvent("node_remove", `Удалена нода ${id}`);
    });

    const currentEdgeIds =
      graph.edgeList?.map((e: any) => `${e.source}-${e.target}`) || [];
    const addedEdges = currentEdgeIds.filter(
      (id) => !previousGraphState.value.edges.includes(id),
    );
    const removedEdges = previousGraphState.value.edges.filter(
      (id) => !currentEdgeIds.includes(id),
    );

    addedEdges.forEach((id) => {
      sendEvent("edge_add", `Добавлено ребро ${id}`);
    });
    removedEdges.forEach((id) => {
      sendEvent("edge_remove", `Удалено ребро ${id}`);
    });

    previousGraphState.value = {
      nodes: [...currentNodeIds],
      edges: [...currentEdgeIds],
    };
  },
  { deep: false },
);

const { mutate: solveTaskMutation } = useMutation(SOLVE_TASK_GRAPH);

const solveTask = async () => {
  const graph = convertToGqlFormat(nodeStore);
  graph.id = self.crypto.randomUUID();

  const request = {
    solution: {
      id: self.crypto.randomUUID(),
      taskId: activeTask.value.id,
      authorId: authorId, // На бэкенде определяется jwt пользователя
      graph,
    },
  };

  try {
    sendEvent("submit", "Пользователь отправил решение");

    const response = await solveTaskMutation(request);

    if (!response?.data) {
      console.error("No data received");
      return;
    }

    const { isCorrect, pluginResults } = response.data.solveTaskGraph;

    if (isCorrect) {
      sendEvent("task_success", "Задача решена успешно");
      successAlert.value = true;
      errorAlert.value = false;
      emit("isCorrect", true);
      props.onCorrectSolution?.();
    } else {
      sendEvent("task_wrong", "Задача решена неверно");
      errorAlert.value = true;
      successAlert.value = false;

      const incorrectResults = pluginResults.filter(
        (item: PluginResult) => !item.isCorrect,
      );

      result.value = activeTask.value.isHiddenMistake
        ? [incorrectResults[0]]
        : incorrectResults;

      result.value = result.value.map((item) => ({
        ...item,
        mistakeText:
          activeTask.value.condition.find(
            (element: any) => element.pluginId === item.pluginId,
          )?.mistakeText || "",
      }));
    }
  } catch (error) {
    console.error("Error solving task:", error);
    errorAlert.value = true;
    successAlert.value = false;
  }
};
</script>
<style scoped>
.drawer-toggle-btn {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    border-radius: 20px 0 0 20px !important;
    height: 60px !important;
    width: 40px !important;
    background-color: #1976d2 !important;
    color: white !important;
    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 5;
}

.text-pre-wrap {
    white-space: pre-wrap;
}
</style>
