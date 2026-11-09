<script setup lang="ts">
import { ref } from "vue";
import { convertToGqlFormat } from "@/features/graph/lib/helpers/GqlFormatter";
import { useNodeStore } from "@/features/graph/stores/nodes";

const nodeStore = useNodeStore();
const showDialog = ref(false);

const downloadOptions = [
  {
    title: "Тестирования плагинов",
    description: "Скачать данные для тестирования Java-плагинов",
    icon: "mdi-graphql",
    color: "deep-purple lighten-1",
    action: () => convertToGqlFormat(nodeStore.$state),
  },
  {
    title: "Сохранение в приложении",
    description: "Скачать исходные данные",
    icon: "mdi-content-save-all",
    color: "teal lighten-1",
    action: () => nodeStore.$state,
  },
];

const downloadJson = (dataGenerator: () => any) => {
  const data = dataGenerator();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `graph-data-${Date.now().toString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showDialog.value = false;
};
</script>

<template>
  <div>
    <v-btn variant="text" color="white" size="small" @click="showDialog = true"> Скачать JSON </v-btn>

    <v-dialog
      v-model="showDialog"
      max-width="600"
      scrollable
      persistent
      @click:outside="showDialog = false"
    >
      <v-card class="download-dialog">
        <v-card-title class="dialog-title px-4 pt-4">
          <v-icon color="primary" class="mr-3">mdi-cloud-download</v-icon>
          <span class="title-text">Выберите вариант экспорта</span>
        </v-card-title>

        <v-card-text class="options-container pa-4">
          <v-row justify="center">
            <v-col
              v-for="(option, index) in downloadOptions"
              :key="index"
              cols="12"
              sm="6"
            >
              <v-hover v-slot="{ isHovering }">
                <v-card
                  :color="option.color"
                  :elevation="isHovering ? 12 : 4"
                  class="option-card"
                  dark
                  @click="downloadJson(option.action)"
                >
                  <v-card-text class="card-content">
                    <v-icon x-large class="option-icon">{{
                      option.icon
                    }}</v-icon>
                    <h3 class="option-title">{{ option.title }}</h3>
                    <p class="option-description">{{ option.description }}</p>
                  </v-card-text>
                  <v-fade-transition>
                    <div
                      v-if="hover"
                      class="d-flex transition-fast-in-fast-out v-card--reveal display-3 white--text"
                      style="height: 100%"
                    >
                      <v-icon x-large>mdi-download</v-icon>
                    </div>
                  </v-fade-transition>
                </v-card>
              </v-hover>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="dialog-actions px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn @click="showDialog = false" depressed large class="cancel-btn">
            <v-icon left>mdi-close</v-icon>
            Отмена
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.download-dialog {
  border-radius: 8px !important;
}

.dialog-title {
  background: #f5f7fa;
  padding-bottom: 16px;
  display: flex;
  align-items: center;
}

.title-text {
  margin-left: 8px;
  font-size: 1.25rem;
  font-weight: 500;
}

.options-container {
  padding: 16px;
}

.option-card {
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 180px;
  position: relative;
  overflow: hidden;
}

.option-card:hover {
  transform: translateY(-5px);
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 2;
  position: relative;
}

.option-icon {
  margin-bottom: 12px;
}

.option-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.option-description {
  font-size: 0.85rem;
  opacity: 0.9;
}

.v-card--reveal {
  align-items: center;
  bottom: 0;
  justify-content: center;
  opacity: 0.8;
  position: absolute;
  width: 100%;
  background: rgba(0, 0, 0, 0.3) !important;
}

.dialog-actions {
  background: #f5f5f5;
}

.cancel-btn {
  transition: all 0.2s ease;
  min-width: 120px;
  border: 1px solid black;
}

.cancel-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
</style>
