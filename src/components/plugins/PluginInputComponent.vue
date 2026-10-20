<template>
  <div class="pa-4 text-center">
    <v-dialog v-model="dialogModel" max-width="800">
      <v-card>
        <v-card-title>Создание плагина</v-card-title>
        <v-card-text>
          <v-text-field
            label="Название"
            v-model="nameModel"
            :maxLength="MAX_INPUT_LENGTH()"
          ></v-text-field>
          <v-text-field
            label="Описание"
            v-model="descriptionModel"
            :maxLength="MAX_INPUT_LENGTH()"
          ></v-text-field>
          <v-text-field
            label="Категория"
            v-model="categoryModel"
            :maxLength="MAX_INPUT_LENGTH()"
          ></v-text-field>
          <v-select
            label="Тип графа"
            :items="['DIRECT', 'UNDIRECT', 'ANY']"
            v-model="graphTypeModel"
          ></v-select>
          <v-select
            label="Тип плагина"
            :items="[
              'GRAPH_PROPERTY',
              'GRAPH_CHARACTERISTIC',
              'GRAPH_NEW_GRAPH',
              'GRAPH_STRING',
            ]"
            v-model="pluginTypeModel"
          ></v-select>
          <v-file-input label="Jar файл" v-model="jarFileModel"></v-file-input>

          <v-alert
            v-if="errorMessage"
            type="error"
            dense
            dismissible
            class="mt-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-card-actions>
            <v-btn color="primary" variant="outlined" @click="savePlugin"
              >Сохранить</v-btn
            >
            <v-btn
              color="primary"
              variant="outlined"
              @click="closeDialogAndClearError"
              >Закрыть</v-btn
            >
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { usePluginStore } from "@/store/plugin";
import { storeToRefs } from "pinia";
import { defineComponent, ref, watch } from "vue"; // Import 'ref' and 'watch'
import { buildPluginInputModels } from "./helper/inputModel";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_PLUGIN, UPDATE_PLUGIN } from "@/api/Mutations";
import { MAX_INPUT_LENGTH } from "@/shared/config/SIZES";
import { bulkIndexPlugins } from "@/services/semanticSearchApi";
import { getUserFromToken } from "@/entities/user/lib/getUserFromToken";

export default defineComponent({
  setup() {
    const { pluginInput, plugins, dialog } = storeToRefs(usePluginStore());
    const MAX_LENGTH = MAX_INPUT_LENGTH;
    const token = localStorage.getItem("token");
    const userInfo = getUserFromToken(token);          
    const NULL_UUID = "00000000-0000-0000-0000-000000000000";
    const authorId = userInfo?.id ?? NULL_UUID;        
    const {
      nameModel,
      descriptionModel,
      categoryModel,
      graphTypeModel,
      pluginTypeModel,
      jarFileModel,
      dialogModel,
    } = buildPluginInputModels();

    const errorMessage = ref<string | null>(null);

    watch(dialogModel, (newValue) => {
      if (!newValue) {
        errorMessage.value = null;
      }
    });

    return {
      nameModel,
      descriptionModel,
      categoryModel,
      graphTypeModel,
      pluginTypeModel,
      jarFileModel,
      pluginInput,
      plugins,
      dialogModel,
      dialog,
      errorMessage,
      authorId
    };
  },
  methods: {
    MAX_INPUT_LENGTH() {
      return MAX_INPUT_LENGTH;
    },
    savePlugin() {
      this.errorMessage = null;
      if (this.pluginInput.id) {
        this.updatePlugin();
      } else {
        this.createPlugin();
      }
    },
    toBase64(file: File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    },
    async createPlugin() {
      const id = self.crypto.randomUUID();
      const file = this.pluginInput.jarFile[0];
      const fileName = (file.name as string).replace(".jar", "");
      let jarFile = (await this.toBase64(file)) as string;
      const base64Index = jarFile.indexOf("base64,");
      jarFile =
        base64Index !== -1
          ? jarFile.substring(base64Index + "base64,".length)
          : jarFile;
      const { mutate, onDone, onError } = useMutation(CREATE_PLUGIN);
      const request = {
        plugin: {
          id: id,
          name: this.pluginInput.name,
          description: this.pluginInput.description,
          category: this.pluginInput.category,
          graphType: this.pluginInput.graphType,
          pluginType: this.pluginInput.pluginType,
          isInternal: false,
          authorId: this.authorId, 
          isValid: false,
          jarName: fileName,
          jarFile: jarFile,
        },
      };
      mutate(request);

      onDone((response) => {
        console.log(response);
        const index = this.plugins.findIndex((item) => {
          return item.id === this.pluginInput.id;
        });
        this.plugins = [...this.plugins, response.data.createPlugin];
        this.dialog = false;
        this.dialogModel = false;
        this.errorMessage = null;
        this.indexPluginForSemantic(response.data.createPlugin);
      });

      onError(({ graphQLErrors }) => {
        if (graphQLErrors && graphQLErrors.length > 0) {
          this.errorMessage = `Ошибка при выгрузке плагина: ${graphQLErrors[0].message}`;
        } else {
          this.errorMessage =
            "Произошла неизвестная ошибка при создании плагина.";
        }
        console.error("Error creating plugin:", graphQLErrors);
      });
    },
    async updatePlugin() {
      let fileName;
      let jarFile;
      if (this.pluginInput.jarFile && this.pluginInput.jarFile.length > 0) {
        const file = this.pluginInput.jarFile[0];
        fileName = (file.name as string).replace(".jar", "");
        jarFile = ((await this.toBase64(file)) as string).replace(
          "data:application/x-java-archive;base64,",
          "",
        );
      } else {
        fileName = "";
        jarFile = "";
      }

      const { mutate, onDone, onError } = useMutation(UPDATE_PLUGIN);
      const request = {
        plugin: {
          id: this.pluginInput.id,
          name: this.pluginInput.name,
          description: this.pluginInput.description,
          category: this.pluginInput.category,
          graphType: this.pluginInput.graphType,
          pluginType: this.pluginInput.pluginType,
          isInternal: false,
          authorId: this.authorId,
          isValid: false,
          jarName: fileName,
          jarFile: jarFile,
        },
      };
      mutate(request);

      onDone((response) => {
        const index = this.plugins.findIndex((item) => {
          return item.id === this.pluginInput.id;
        });
        this.plugins = [
          ...this.plugins.slice(0, index),
          response.data.updatePlugin,
          ...this.plugins.slice(index + 1),
        ];
        this.dialog = false;
        this.dialogModel = false;
        this.errorMessage = null;
        this.indexPluginForSemantic(response.data.updatePlugin);
      });

      onError(({ graphQLErrors }) => {
        if (graphQLErrors && graphQLErrors.length > 0) {
          this.errorMessage = `Ошибка при обновлении плагина: ${graphQLErrors[0].message}`;
        } else {
          this.errorMessage =
            "Произошла неизвестная ошибка при обновлении плагина.";
        }
        console.error("Error updating plugin:", graphQLErrors);
      });
    },
    closeDialogAndClearError() {
      this.dialogModel = false;
      this.errorMessage = null;
    },
    async indexPluginForSemantic(plugin: {
      id: string;
      name: string;
      description?: string | null;
      category?: string | null;
      graphType?: string | null;
      pluginType?: string | null;
    }) {
      try {
        await bulkIndexPlugins([
          {
            id: plugin.id,
            name: plugin.name,
            description: plugin.description ?? "",
            category: plugin.category ?? "",
            graphType: plugin.graphType ?? "",
            pluginType: plugin.pluginType ?? "",
          },
        ]);
      } catch (error) {
        console.error("Failed to sync plugin with semantic search", error);
      }
    },
  },
});
</script>
