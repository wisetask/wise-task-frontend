<template>
  <v-layout>
    <div style="position: relative; width: 100%; height: 100vh;">
      <Graph
          :style="{
          width: '100%',
          height: '100%',
          border: '1px solid black',
          boxSizing: 'border-box',
        }"
      />

      <v-btn
          v-if="!drawer"
          icon
          class="drawer-toggle-btn"
          @click="drawer = true"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
    </div>

    <v-navigation-drawer
        v-model="drawer"
        location="right"
        temporary
        :width="drawerWidth"
    >
      <div class="d-flex justify-end pa-2">
        <v-btn icon @click="drawer = false">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-container>
        <v-row>
          <v-col>
            <graph-input-component />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <graph-filter-component />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <graph-table-component />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>
  </v-layout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_ALL_GRAPHS } from "@/api/Queries";
import { useGraphStore } from "@/store/graph";
import { useProfileStore } from "@/store/profile";
import { toVGraph } from "./network/helper/graph";
import Graph from "@/features/graph/ui/graph/Graph.vue";

export default defineComponent({
  components: { Graph },
  setup() {
    const drawer = ref(false);
    const drawerWidth = ref(600);

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

    const graphStore = useGraphStore();
    graphStore.graphLibrary = [];

    // Поля GraphFilterInput; уходят на бэкенд только после нажатия «Найти»
    // (isFiltered), незаполненные — как undefined.
    const requestVariables = computed(() => {
      const { name, authorId, vertexCount, edgeCount, isDirect, isNamed, isFiltered } =
          graphStore.graphFilter;
      return {
        request: {
          pagination: { page: 0, pageSize: 100 },
          filter: !isFiltered ? undefined : {
            name: name.trim() || undefined,
            authorId: authorId || undefined,
            vertexCount: vertexCount ?? undefined,
            edgeCount: edgeCount ?? undefined,
            isDirect: isDirect === "" ? undefined : isDirect,
            isNamed: isNamed === "" ? undefined : isNamed,
          },
        },
      };
    });

    const { onResult, refetch } = useQuery(GET_ALL_GRAPHS, requestVariables);
    onResult((response) => {
      if (response.data) {
        const items = response.data.getAllGraphs.items ?? [];
        graphStore.graphLibrary = items.map((graph: any) => toVGraph(graph));
        useProfileStore().addAuthors(items.map((graph: any) => graph.author));
      }
    });

    watch(
        () => graphStore.graphFilter.appliedAt,
        () => refetch(requestVariables.value),
    );

    return { drawer, drawerWidth };
  },
});
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
</style>