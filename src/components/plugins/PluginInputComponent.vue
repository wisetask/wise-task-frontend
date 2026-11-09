<template>
  <v-dialog v-model="dialogModel" max-width="640">
    <v-card class="plugin-dialog">
      <div class="plugin-dialog__header">
        <span class="plugin-dialog__icon">
          <v-icon size="20" icon="mdi-puzzle-outline" />
        </span>
        <span class="plugin-dialog__title">{{ dialogTitle }}</span>
      </div>

      <div class="plugin-dialog__body">
        <v-text-field
          label="Название"
          v-model="nameModel"
          :maxLength="MAX_INPUT_LENGTH()"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-text-field>
        <v-text-field
          label="Описание"
          v-model="descriptionModel"
          :maxLength="MAX_INPUT_LENGTH()"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-text-field>
        <v-text-field
          label="Категория"
          v-model="categoryModel"
          :maxLength="MAX_INPUT_LENGTH()"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-text-field>
        <v-select
          label="Тип графа"
          :items="graphTypeItems"
          v-model="graphTypeModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-select>
        <v-select
          label="Тип плагина"
          :items="pluginTypeItems"
          v-model="pluginTypeModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-select>
        <v-file-input
          label="Jar файл"
          v-model="jarFileModel"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        ></v-file-input>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="comfortable"
          class="plugin-error-alert"
        >
          {{ errorMessage }}
        </v-alert>
      </div>

      <v-divider />

      <div class="plugin-dialog__actions">
        <v-btn color="#1976d2" variant="flat" prepend-icon="mdi-content-save" @click="savePlugin">
          Сохранить
        </v-btn>
        <v-spacer />
        <v-btn color="#5c6470" variant="text" @click="closeDialogAndClearError">
          Закрыть
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { usePluginStore } from "@/store/plugin";
import { storeToRefs } from "pinia";
import { defineComponent, ref, watch } from "vue";
import { buildPluginInputModels } from "./helper/inputModel";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_PLUGIN, UPDATE_PLUGIN } from "@/api/Mutations";
import { MAX_INPUT_LENGTH } from "@/shared/config/SIZES";
import { getUserFromToken } from "@/entities/user/lib/getUserFromToken";
import { extractPluginExecutionError } from "@/shared/lib/pluginExecutionError";

const GRAPH_TYPE_ITEMS = [
  { title: "Направленный", value: "DIRECT" },
  { title: "Неориентированный", value: "UNDIRECT" },
  { title: "Любой", value: "ANY" },
];

const PLUGIN_TYPE_ITEMS = [
  { title: "Характеристика графа", value: "GRAPH_CHARACTERISTIC" },
  { title: "Свойство графа", value: "GRAPH_PROPERTY" },
  { title: "Новый граф", value: "GRAPH_NEW_GRAPH" },
  { title: "Строковый", value: "GRAPH_STRING" },
];

export default defineComponent({
  computed: {
    dialogTitle(): string {
      return this.pluginInput.id ? "Редактирование плагина" : "Создание плагина";
    },
    graphTypeItems() {
      return GRAPH_TYPE_ITEMS;
    },
    pluginTypeItems() {
      return PLUGIN_TYPE_ITEMS;
    },
  },
  setup() {
    const { pluginInput, plugins, dialog } = storeToRefs(usePluginStore());
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
        this.plugins = [...this.plugins, response.data.createPlugin];
        this.dialog = false;
        this.dialogModel = false;
        this.errorMessage = null;
      });

      onError((error) => {
        const { graphQLErrors } = error;
        const pluginError = extractPluginExecutionError(error);
        if (pluginError) {
          this.errorMessage = `Ошибка при выгрузке плагина: плагин совершил ошибку выполнения:\n${pluginError.reason}`;
        } else if (graphQLErrors && graphQLErrors.length > 0) {
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
      });

      onError((error) => {
        const { graphQLErrors } = error;
        const pluginError = extractPluginExecutionError(error);
        if (pluginError) {
          this.errorMessage = `Ошибка при обновлении плагина: плагин совершил ошибку выполнения:\n${pluginError.reason}`;
        } else if (graphQLErrors && graphQLErrors.length > 0) {
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
  },
});
</script>

<style scoped>
.plugin-dialog {
  border-radius: 14px !important;
  border: 1px solid #d6e5f5;
  overflow: hidden;
}

.plugin-dialog__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
}

.plugin-dialog__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
}

.plugin-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.plugin-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.plugin-dialog__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.plugin-error-alert {
  white-space: pre-wrap;
}
</style>
