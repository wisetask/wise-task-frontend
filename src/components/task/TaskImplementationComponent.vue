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
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { SOLVE_TASK_IMPLEMENTATION } from "@/api/Mutations";
import { GET_TASK } from "@/api/Queries";
import { useTaskStore } from "@/store/task";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { storeToRefs } from "pinia";
import { defineComponent } from "vue";
import { getUserFromToken } from "@/entities/user/lib/getUserFromToken";

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
    onResult((response) => {
      if (response.data) {
        activeTask.value = response.data.getTask;
      }
    });

    return {
      activeTask, authorId
    };
  },
  data() {
    return {
      successAlert: false,
      errorAlert: false,
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

      mutate(request);

      onDone((response) => {
        if (response.data) {
          if (response.data.solveTaskImplementation.isCorrect) {
            this.successAlert = true;
            this.errorAlert = false;
            if (this.onCorrectSolution) {
              this.onCorrectSolution();
            }
          } else {
            this.errorAlert = true;
            this.successAlert = false;
          }
          this.result =
            response.data.solveTaskImplementation.implementationResult;
          console.log(response.data);
        }
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

<style scoped></style>
