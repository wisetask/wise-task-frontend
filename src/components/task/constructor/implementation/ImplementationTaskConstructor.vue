<template>
  <v-card>
    <v-card-title>Создание задачи на реализацию</v-card-title>
    <v-card-text>
      <v-textarea
        variant="outlined"
        v-model="taskImplementationInput.description"
        :maxLength="MAX_INPUT_LENGTH()"
      ></v-textarea>
      <v-container>
        <v-row>
          <v-text-field
            class="ma-2"
            :maxLength="MAX_INPUT_LENGTH()"
            label="Название задачи"
            variant="outlined"
            v-model="nameModel"
          ></v-text-field>
          <v-text-field
            class="ma-2"
            label="Категория задачи"
            variant="outlined"
            v-model="categoryModel"
            :maxLength="MAX_INPUT_LENGTH()"
          ></v-text-field>
        </v-row>
      </v-container>
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
  <task-implementation-plugin-table-component></task-implementation-plugin-table-component>
</template>
<script lang="ts">
import { useTaskStore } from "@/store/task";
import { storeToRefs } from "pinia";
import { defineComponent, computed } from "vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { GET_ALL_PLUGINS } from "@/api/Queries";
import { usePluginStore } from "@/store/plugin";
import { CREATE_TASK_IMPLEMENTATION } from "@/api/Mutations";
import { MAX_INPUT_LENGTH } from "@/shared/config/SIZES";
import { bulkIndexTasks } from "@/services/semanticSearchApi";

export default defineComponent({
  setup() {
    const { plugins } = storeToRefs(usePluginStore());
    const { taskImplementationInput } = storeToRefs(useTaskStore());
    const { onResult } = useQuery(GET_ALL_PLUGINS);
    onResult((response) => {
      if (response.data) {
        plugins.value = response.data.getAllPlugins.items ?? [];
      }
    });
    const nameModel = computed({
      get() {
        return taskImplementationInput.value.name;
      },
      set(value) {
        taskImplementationInput.value.name = value;
      },
    });

    const categoryModel = computed({
      get() {
        return taskImplementationInput.value.category;
      },
      set(value) {
        taskImplementationInput.value.category = value;
      },
    });

    return {
      nameModel,
      categoryModel,
      taskImplementationInput,
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
      this.taskImplementationInput.id = self.crypto.randomUUID();
      this.taskImplementationInput.authorId =
        "00000000-0000-0000-0000-000000000000"; //TODO: activeUser
      const request = {
        task: this.taskImplementationInput,
      };
      const { mutate, onDone, onError } = useMutation(
        CREATE_TASK_IMPLEMENTATION,
      );

      mutate(request);
      onDone((response) => {
        console.log(response);
        this.alert = true;
        this.indexTaskForSemantic();
      });

      onError(({ graphQLErrors }) => {
        if (graphQLErrors) {
          graphQLErrors.map(({ message }) => {
            console.error(message);
          });
        }
      });
    },
    async indexTaskForSemantic() {
      try {
        await bulkIndexTasks([
          {
            id: this.taskImplementationInput.id ?? self.crypto.randomUUID(),
            name: this.taskImplementationInput.name,
            description: this.taskImplementationInput.description,
            category: this.taskImplementationInput.category,
          },
        ]);
      } catch (error) {
        console.error("Failed to sync implementation task with semantic search", error);
      }
    },
  },
});
</script>
