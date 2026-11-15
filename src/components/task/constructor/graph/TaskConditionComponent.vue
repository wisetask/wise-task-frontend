<template>
  <v-card class="my-4">
    <v-card-title>Настройки условия</v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-text-field
            class="ma-2"
            label="Название задачи"
            variant="outlined"
            v-model="taskNameModel"
            :maxLength="MAX_INPUT_LENGTH()"
          ></v-text-field>
          <v-text-field
            class="ma-2"
            label="Категория задачи"
            variant="outlined"
            v-model="taskCategoryModel"
            :maxLength="MAX_INPUT_LENGTH()"
          ></v-text-field>
        </v-row>
      </v-container>
      <v-container>
        <v-row>
          <v-switch label="Граф задан" v-model="graphPresentModel"></v-switch>
          <v-switch
            label="Показывать ошибку только в первом модуле"
            v-model="isHiddenMistake"
          ></v-switch>
        </v-row>
      </v-container>
      <v-container>
        <v-row v-if="taskGraphConstructorInfo.isGraphPresent">
          <v-switch
            label="Можно редактировать"
            v-model="isEditModel"
          ></v-switch>
          <v-switch label="Можно красить" v-model="isColorModel"></v-switch>
          <v-switch
            label="Можно удалять вершины"
            v-model="isDeleteModel"
          ></v-switch>
        </v-row>
      </v-container>
      <v-select
        label="Вид графа"
        :items="['Ориентированный', 'Неориентированный', 'Любой']"
        variant="outlined"
        v-model="graphTypeModel"
      ></v-select>
      <task-condition-list-component></task-condition-list-component>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" variant="outlined" @click="createTask">
        Создать задачу
      </v-btn>
    </v-card-actions>
    <v-alert
      v-model="alert"
      text="Задача успешно создана"
      title="Успех!"
      type="success"
      closable
      variant="tonal"
    ></v-alert>
  </v-card>
</template>

<script lang="ts">
import { useTaskStore } from "@/store/task";
import { computed, defineComponent } from "vue";
import { storeToRefs } from "pinia";
import { GraphType } from "@/__generated__/graphql";
import { toGraph } from "@/components/graph/network/helper/graph";
import { useGraphStore } from "@/store/graph";
import { CREATE_TASK_GRAPH } from "@/api/Mutations";
import { useMutation } from "@vue/apollo-composable";
import { useNodeStore } from "@/features/graph/stores/nodes";
import { convertToGqlFormat } from "@/features/graph/lib/helpers/GqlFormatter";
import { MAX_INPUT_LENGTH } from "@/shared/config/SIZES";
import { getUserFromToken } from "@/entities/user/lib/getUserFromToken";

const nodeStore = useNodeStore();

export default defineComponent({
  setup() {
    const { taskGraphConstructorInfo, taskGraphInput } =
      storeToRefs(useTaskStore());
    const token = localStorage.getItem("token");
    const userInfo = getUserFromToken(token);          
    const NULL_UUID = "00000000-0000-0000-0000-000000000000";
    const authorId = userInfo?.id ?? NULL_UUID;        
    const graphPresentModel = computed({
      get() {
        return taskGraphConstructorInfo.value.isGraphPresent;
      },
      set(value) {
        taskGraphConstructorInfo.value.isGraphPresent = value;
      },
    });

    const graphTypeModel = computed({
      get() {
        switch (taskGraphConstructorInfo.value.graphType) {
          case GraphType.Any:
            return "Любой";
          case GraphType.Direct:
            return "Ориентированный";
          case GraphType.Undirect:
            return "Неориентированный";
        }
      },
      set(value) {
        switch (value) {
          case "Любой":
            taskGraphConstructorInfo.value.graphType = GraphType.Any;
            nodeStore.isDirected = true;
            return;
          case "Ориентированный":
            taskGraphConstructorInfo.value.graphType = GraphType.Direct;
            nodeStore.isDirected = true;
            return;
          case "Неориентированный":
            taskGraphConstructorInfo.value.graphType = GraphType.Undirect;
            nodeStore.isDirected = false;
            return;
        }
      },
    });

    const isEditModel = computed({
      get() {
        return taskGraphInput.value.rule.isEdit;
      },
      set(value) {
        taskGraphInput.value.rule.isEdit = value;
      },
    });

    const isColorModel = computed({
      get() {
        return taskGraphInput.value.rule.isColor;
      },
      set(value) {
        taskGraphInput.value.rule.isColor = value;
      },
    });

    const isDeleteModel = computed({
      get() {
        return taskGraphInput.value.rule.isDelete;
      },
      set(value) {
        taskGraphInput.value.rule.isDelete = value;
      },
    });

    const isHiddenMistake = computed({
      get() {
        return taskGraphInput.value.isHiddenMistake;
      },
      set(value) {
        taskGraphInput.value.isHiddenMistake = value;
      },
    });

    const taskNameModel = computed({
      get() {
        return taskGraphInput.value.name;
      },
      set(value) {
        taskGraphInput.value.name = value;
      },
    });

    const taskCategoryModel = computed({
      get() {
        return taskGraphInput.value.category;
      },
      set(value) {
        taskGraphInput.value.category = value;
      },
    });

    const { activeGraph } = storeToRefs(useGraphStore());

    return {
      graphPresentModel,
      graphTypeModel,
      taskGraphConstructorInfo,
      isEditModel,
      isColorModel,
      isDeleteModel,
      isHiddenMistake,
      activeGraph,
      taskGraphInput,
      taskNameModel,
      taskCategoryModel,
      authorId
    };
  },
  data() {
    return {
      alert: false,
    };
  },
  methods: {
    MAX_INPUT_LENGTH() {
      return MAX_INPUT_LENGTH;
    },
    createTask() {
      if (!this.activeGraph.id) {
        this.activeGraph.id = self.crypto.randomUUID();
      }
      const graph = convertToGqlFormat(nodeStore.$state);
      console.log(nodeStore.$state);
      const { mutate, onDone, onError } = useMutation(CREATE_TASK_GRAPH);
      console.log("GRAPH", graph);
      if (graph) {
        this.taskGraphInput.graph = graph;
      }
      const request = {
        task: this.taskGraphInput,
      };
      console.log(request);
      this.taskGraphInput.id = self.crypto.randomUUID();
      this.taskGraphInput.authorId = this.authorId
      mutate(request);

      onDone((response) => {
        console.log(response);
        this.alert = true;
      });

      onError(({ graphQLErrors }) => {
        if (graphQLErrors) {
          graphQLErrors.map(({ message }) => {
            console.error(message);
          });
        }
      });
    },
  },
});
</script>
