<template>
  <v-container v-if="!taskGraphConstructorInfo.isGraphPresent" class="fill-height">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" md="8" lg="6">
        <v-textarea
            variant="outlined"
            auto-grow
            :maxLength="MAX_INPUT_LENGTH()"
            v-model="taskTextModel"
        />
        <task-condition-component />
        <task-graph-plugin-table-component />
      </v-col>
    </v-row>
  </v-container>

  <v-layout v-else>
    <div style="position: relative; width: 100%; height: 100vh">
      <Graph
          :style="{
          width: '100%',
          height: '100%',
          border: '1px solid black',
          boxSizing: 'border-box',
        }"
          :can-color="taskGraphInput.rule.isColor"
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
            <v-textarea
                variant="outlined"
                auto-grow
                :maxLength="MAX_INPUT_LENGTH()"
                v-model="taskTextModel"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <task-condition-component />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <task-graph-plugin-table-component />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>
  </v-layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onMounted, onUnmounted } from "vue";
import { usePluginStore } from "@/store/plugin";
import { storeToRefs } from "pinia";
import { useQuery } from "@vue/apollo-composable";
import { GET_ALL_PLUGINS } from "@/api/Queries";
import { useTaskStore } from "@/store/task";
import Graph from "@/features/graph/ui/graph/Graph.vue";
import { MAX_INPUT_LENGTH } from "@/shared/config/SIZES";

export default defineComponent({
  methods: {
    MAX_INPUT_LENGTH() {
      return MAX_INPUT_LENGTH;
    },
  },
  components: { Graph },
  setup() {
    const { plugins } = storeToRefs(usePluginStore());
    const { onResult } = useQuery(GET_ALL_PLUGINS);
    const { taskGraphInput, taskGraphConstructorInfo } =
        storeToRefs(useTaskStore());

    onResult((response) => {
      if (response.data) {
        plugins.value = response.data.getAllPlugins.items ?? [];
      }
    });

    const taskTextModel = computed({
      get() {
        return taskGraphInput.value.description;
      },
      set(value) {
        taskGraphInput.value.description = value;
      },
    });

    const drawer = ref(true);
    const drawerWidth = ref(600);

    const updateDrawerWidth = () => {
      drawerWidth.value = Math.max(600, window.innerWidth * 0.7);
    };

    onMounted(() => {
      updateDrawerWidth();
      window.addEventListener("resize", updateDrawerWidth);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateDrawerWidth);
    });

    return {
      taskTextModel,
      taskGraphInput,
      taskGraphConstructorInfo,
      drawer,
      drawerWidth,
    };
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

.fill-height {
  min-height: 100vh;
}
</style>
