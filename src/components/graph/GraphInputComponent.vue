<template>
  <div class="flt-panel">
    <div class="flt-panel__header">
      <span class="flt-panel__icon">
        <v-icon size="20" icon="mdi-plus" />
      </span>
      <span class="flt-panel__title">Добавление графа</span>
    </div>
    <div class="flt-panel__body">
      <v-text-field label="Название графа" v-model="name" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
    </div>
    <div class="flt-panel__actions">
      <v-btn color="#1976d2" variant="flat" prepend-icon="mdi-content-save" @click="saveGraph">
        Добавить
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { useGraphStore } from "@/store/graph";
import { storeToRefs } from "pinia";
import { defineComponent, computed, onMounted } from "vue";
import { CREATE_GRAPH } from "@/api/Mutations";
import { useMutation } from "@vue/apollo-composable";
import { useNodeStore } from "@/features/graph/stores/nodes";
import { convertToGqlFormat } from "@/features/graph/lib/helpers/GqlFormatter";

export default defineComponent({
  setup() {
    const { graphLibrary } = storeToRefs(useGraphStore());
    const graph = useNodeStore();
    const name = computed({
      get() {
        return graph.$state.name;
      },
      set(value) {
        graph.$state.name = value;
      },
    });
    return {
      name,
      graph,
      graphLibrary,
    };
  },
  methods: {
    saveGraph() {
      if (!this.graph.$state.id) {
        this.graph.$state.id = self.crypto.randomUUID();
      }
      const graph = convertToGqlFormat(this.graph);
      const { mutate, onError } = useMutation(CREATE_GRAPH);
      const request = {
        graph: graph,
      };
      mutate(request);

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

<style>
@import "@/components/common/filterStyles.css";
</style>
